const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  EmbedBuilder,
} = require('discord.js');
const adminWarnSchema = require('../../models/admin-warn');

// Generare ID unic pentru avertisment
const randomId = (length = 24) => Math.random().toString(36).substring(2, length + 2);

// Verificare unicitate ID
const checkId = (id, existing = []) => !existing.includes(id);

// Creare ID unic
const getId = ({ length, existing = [] }) => {
  let attempts = 0;
  let id = false;
  while (!id && attempts < 100) {
    id = randomId(length);
    if (!checkId(id, existing)) {
      id = false;
      attempts++;
    }
  }
  return id;
};

// Creare Embed de eroare
const createErrorEmbed = (title, description) => new EmbedBuilder()
  .setColor("DarkRed")
  .setTitle(title)
  .setDescription(description);

// Avertizare Admin
module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    try {
      const targetUserId = interaction.options.get('target-user').value;
      const reason = interaction.options.get('reason')?.value || 'Niciun motiv furnizat';

      await interaction.deferReply();

      const targetUser = await interaction.guild.members.fetch(targetUserId);
      
      // Verifică dacă este un bot
      if (targetUser.user.bot) {
        const botEmbed = createErrorEmbed("🙅🏿Nu poți (ADMIN) avertiza un BOT", "Avertismentele nu pot fi aplicate boturilor.");
        return interaction.editReply({embeds: [botEmbed]});
      }

      // Verifică dacă utilizatorul există
      if (!targetUser) {
        const userNotFoundEmbed = createErrorEmbed("🙅🏿Acest utilizator nu există pe acest server", "Nu am găsit utilizatorul solicitat.");
        return interaction.editReply({embeds: [userNotFoundEmbed]});
      }

      // Verifică dacă utilizatorul este proprietar
      if (targetUser.id === interaction.guild.ownerId) {
        const userOwnerEmbed = createErrorEmbed("🙅🏿Nu poți (ADMIN) avertiza acest utilizator", "Nu poți avertiza proprietarul serverului.");
        return interaction.editReply({embeds: [userOwnerEmbed]});
      }

      const targetUserRolePosition = targetUser.roles.highest.position;
      const requestUserRolePosition = interaction.member.roles.highest.position;
      const botRolePosition = interaction.guild.members.me.roles.highest.position;

      // Verifică dacă rolul utilizatorului țintă este mai mare sau egal cu rolul solicitantului
      if (targetUserRolePosition >= requestUserRolePosition) {
        const sameRoleEmbed = createErrorEmbed("🙅🏿Nu poți (ADMIN) avertiza acest utilizator", "Acest utilizator are același rol sau un rol mai mare decât al tău.");
        return interaction.editReply({embeds: [sameRoleEmbed]});
      }

      // Verifică permisiunile botului
      if (targetUserRolePosition >= botRolePosition) {
        const botRoleEmbed = createErrorEmbed("🙅🏿(BOT PERMS)Nu pot avertiza acest utilizator", "Rolul botului este prea mic pentru a aplica avertismente.");
        return interaction.editReply({embeds: [botRoleEmbed]});
      }

      // Creează avertismentul
      const warnUid = getId({ length: 24 });
      const datetime = new Date().toLocaleString();

      const warning = {
        admin: interaction.member.displayName,
        data: datetime,
        motiv: reason,
        warnUUID: `AdMId${warnUid}`,
      };

      const serverId = interaction.guild.id;
      const memberId = targetUserId;

      // Salvează avertismentul în baza de date
      const userWarnings = await adminWarnSchema.findOneAndUpdate(
        { serverId, memberId },
        {
          $push: { adminwarns: warning },
          $inc: { adminWarnings: 1 },
        },
        { upsert: true, new: true }
      );

      const getUserWarnings = userWarnings.adminWarnings;

      // Trimite embed cu avertismentul
      const messageCallBack = new EmbedBuilder()
        .setAuthor({ name: `${targetUser.displayName} - A PRIMIT UN AVERTISMENT DIN PARTEA UNUI ADMINISTRATOR❗`, iconURL: targetUser.user.displayAvatarURL({ dynamic: true }) })
        .setColor("DarkRed");
      interaction.editReply({ embeds: [messageCallBack] });

      // Verifică dacă utilizatorul are 2 avertismente și interzice-l
      if (getUserWarnings >= 2) {
        // await targetUser.ban({ reason: '2/2 ADMIN WARN' });

        const banEmbed = new EmbedBuilder()
          .setColor("DarkRed")
          .setTitle("🔨 Ban efectuat")
          .setDescription(`**${targetUser.displayName}** a fost banat după ce a primit 2 avertismente din partea unui administrator.`);

        interaction.editReply({ embeds: [banEmbed] });

        // Trimite log de banare în canalul de loguri
        const warningsLogChannel = interaction.guild.channels.cache.get('844966132393050119');
        const banLogEmbed = new EmbedBuilder()
          .setColor("Red")
          .setAuthor({ name: `${targetUser.displayName} BANAT DIN CAUZA A 2 AVERTISMENTE`, iconURL: targetUser.user.displayAvatarURL({ dynamic: true }) })
          .setDescription(`
            > **STAFF ┊ ${interaction.member.displayName}**
            > **MOTIV BAN ┊ 2/2 avertismente administrativ**
            > **AVERTISMENTE ADMIN ┊ ${getUserWarnings}/2**
            > **TOPIC ┊ <#${interaction.channel.id}>**
            > **DATA ┊ ${datetime}**
            > **WARN UNIQUE ID ┊ ${warning.warnUUID}**
          `);

        warningsLogChannel.send({ embeds: [banLogEmbed] });

        // Șterge utilizatorul din baza de date după ce a fost banat
        await adminWarnSchema.deleteOne({ serverId, memberId });

        const deleteEmbed = new EmbedBuilder()
          .setColor("Red")
          .setTitle("🔴 Utilizator șters din baza de date")
          .setDescription(`Datele utilizatorului **${targetUser.displayName}** au fost șterse din baza de date după ce a fost banat.`);
        warningsLogChannel.send({ embeds: [deleteEmbed] });
      }

      // Trimite loguri într-un canal de avertismente, chiar dacă nu se face ban
      const warningsLogChannel = interaction.guild.channels.cache.get('844966132393050119');
      const warningsLogChannelEmbed = new EmbedBuilder()
        .setColor("DarkRed")
        .setAuthor({ name: `${targetUser.displayName} DETALII ADMIN WARN`, iconURL: targetUser.user.displayAvatarURL({ dynamic: true }) })
        .setDescription(`
          > **STAFF ┊ ${interaction.member.displayName}**
          > **MOTIV ┊ ${reason}**
          > **AVERTISMENTE ADMIN ┊ ${getUserWarnings}/2**
          > **TOPIC ┊ <#${interaction.channel.id}>**
          > **DATA ┊ ${datetime}**
          > **WARN UNIQUE ID ┊ ${warning.warnUUID}**
        `);

      warningsLogChannel.send({ embeds: [warningsLogChannelEmbed] });

    } catch (error) {
      console.error("Error processing the adminwarn command:", error);
      const errorEmbed = createErrorEmbed("🙅🏿 A apărut o eroare", "A intervenit o problemă în procesarea comenzii.");
      interaction.editReply({ embeds: [errorEmbed] });
    }
  },

  name: 'adminwarn',
  description: '(ADMIN) Avertizează un membru de pe acest server',
  options: [
    {
      name: 'target-user',
      description: '*(ADMIN) Utilizatorul pe care doriți să-l avertizați',
      type: ApplicationCommandOptionType.Mentionable,
      required: true,
    },
    {
      name: 'reason',
      description: '*(ADMIN) Motivul pentru care doriți să-l avertizați',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.Administrator],
};
