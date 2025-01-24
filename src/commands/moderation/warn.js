const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  EmbedBuilder,
} = require('discord.js');
const warnSchema = require('../../models/nwarns-schema');
const registredWarnIds = require('../../models/registredWarnIds');
const ktmsSystem = require('../../models/ktms-system');
const Level = require('../../models/Level');

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    const targetUserId = interaction.options.get('target-user').value;
    const reason = interaction.options.get('reason')?.value || 'Niciun motiv furnizat';
    await interaction.deferReply();

    const targetUser = await interaction.guild.members.fetch(targetUserId);

    // Verificare dacă este bot
    if (targetUser.user.bot) {
      return interaction.editReply({ embeds: [createEmbed("DarkRed", "🙅🏿Nu poți avertiza un BOT")] });
    }

    // Verificare dacă utilizatorul există
    if (!targetUser) {
      return interaction.editReply({ embeds: [createEmbed("DarkRed", "🙅🏿Acest utilizator nu există pe acest server")] });
    }

    // Verificare dacă este proprietar serverului
    if (targetUser.id === interaction.guild.ownerId) {
      return interaction.editReply({ embeds: [createEmbed("DarkRed", "🙅🏿Nu poți avertiza acest utilizator pentru că este proprietarul serverului.")] });
    }

    // Verificare permisiuni și poziții roluri
    const targetUserRolePosition = targetUser.roles.highest.position;
    const requestUserRolePosition = interaction.member.roles.highest.position;
    const botRolePosition = interaction.guild.members.me.roles.highest.position;

    if (targetUserRolePosition >= requestUserRolePosition) {
      return interaction.editReply({ embeds: [createEmbed("DarkRed", "🙅🏿Nu poți avertiza acest utilizator pentru că are același rol/mai mare decât tine")] });
    }

    if (targetUserRolePosition >= botRolePosition) {
      return interaction.editReply({ embeds: [createEmbed("DarkRed", "🙅🏿(BOT PERMS)Nu pot avertiza acest utilizator pentru că are același rol/mai mare decât mine.")] });
    }

    // Crearea ID-ului unic pentru avertisment
    const randomId = () => Math.random().toString(36).substring(2, 26);
    const warnUid = randomId();
    const currentdate = new Date();
    const datetime = currentdate.toLocaleString('ro-RO', { hour12: false, timeZone: 'Europe/Bucharest' });

    const warning = {
      staff: interaction.member.displayName,
      data: datetime,
      motiv: reason,
      warnUUID: `kTmSId${warnUid}`,
    };

    // Adăugare ID unic în registre
    await registredWarnIds.findOneAndUpdate(
      { serverId: interaction.guild.id },
      { $push: { WarnIDS: warning.warnUUID } },
      { upsert: true, new: true }
    );

    // Actualizare avertisment în baza de date
    const userWarnings = await warnSchema.findOneAndUpdate(
      { serverId: interaction.guild.id, memberId: targetUserId },
      {
        $push: { warnings: warning },
        $inc: { warningsReceived: 1 },
      },
      { upsert: true, new: true }
    );

    const getUserWarnings = userWarnings.warningsReceived;
    const warningsLogChannel = interaction.guild.channels.cache.get('844966132393050119');

    // Crearea embed-urilor pentru notificarea utilizatorului și loguri
    const messageCallBack = new EmbedBuilder()
      .setAuthor({ name: `${targetUser.displayName} - A FOST AVERTIZAT DE CĂTRE STAFF❗`, iconURL: targetUser.user.displayAvatarURL({ dynamic: true }) })
      .setColor("#f5ed00");

    const warnUser3 = new EmbedBuilder()
      .setAuthor({ name: `${targetUser.displayName} - A FOST ELIMINAT DE CĂTRE STAFF (kick)❗`, iconURL: targetUser.user.displayAvatarURL({ dynamic: true }) })
      .setColor("DarkRed");

    const warnUser5 = new EmbedBuilder()
      .setAuthor({ name: `${targetUser.displayName} - A FOST INTERZIS DE CĂTRE STAFF (ban)❗`, iconURL: targetUser.user.displayAvatarURL({ dynamic: true }) })
      .setColor("DarkRed");

    const warningsLogChannelEmbed = new EmbedBuilder()
      .setColor("#f5ed00")
      .setAuthor({ name: `${targetUser.displayName} - DETALII AVERTISMENT`, iconURL: targetUser.user.displayAvatarURL({ dynamic: true }) })
      .setDescription(`\n> **STAFF ┊ ${interaction.member.displayName}**\n\n> **MOTIV ┊ ${reason}**\n\n> **AVERTISMENTE ┊ ${getUserWarnings}/5**\n\n> **TOPIC ┊ <#${interaction.channel.id}>**\n\n> **DATA ┊ ${datetime}**\n\n> **WARN UNIQUE ID ┊ ${warning.warnUUID}**`);

    // Decizia pe baza numărului de avertismente
    if (getUserWarnings === 3) {
      await interaction.editReply({ embeds: [warnUser3] });
      await warningsLogChannel.send({ embeds: [warningsLogChannelEmbed] });
      await targetUser.kick({ reason: "ACUMULĂRII A 3/3 AVERTISMENTE" });

      // Mesaj de log ca embed
      const kickEmbed = new EmbedBuilder()
        .setColor("DarkRed")
        .setTitle(`Kick: ${targetUser.displayName}`)
        .setDescription(`Utilizatorul **${targetUser.displayName}** a primit 3 avertismente și a fost dat kick de către staff. Motivele avertismentelor: 3/3 AVERTISMENTE.`)
        .setTimestamp();
      
      await warningsLogChannel.send({ embeds: [kickEmbed] });

     
    } else if (getUserWarnings === 5) {
      await interaction.editReply({ embeds: [warnUser5] });
      await warningsLogChannel.send({ embeds: [warningsLogChannelEmbed] });
      await targetUser.ban({ reason: "ACUMULĂRII A 5/5 AVERTISMENTE" });

      // Mesaj de log ca embed
      const banEmbed = new EmbedBuilder()
        .setColor("DarkRed")
        .setTitle(`Ban: ${targetUser.displayName}`)
        .setDescription(`Utilizatorul **${targetUser.displayName}** a primit 5 avertismente și a fost interzis de către staff. Motivele avertismentelor: 5/5 AVERTISMENTE.`)
        .setTimestamp();

      await warningsLogChannel.send({ embeds: [banEmbed] });

      // Ștergere din baza de date după ban
      await warnSchema.deleteOne({ serverId: interaction.guild.id, memberId: targetUserId });
      await ktmsSystem.deleteOne({ userId: targetUserId, guildId: interaction.guild.id });
      await Level.deleteOne({ userId: targetUserId, guildId: interaction.guild.id });

    } else {
      await interaction.editReply({ embeds: [messageCallBack] });
      await warningsLogChannel.send({ embeds: [warningsLogChannelEmbed] });
    }

  },

  name: 'warn',
  description: 'Avertizează un membru de pe acest server',
  options: [
    {
      name: 'target-user',
      description: '*Utilizatorul pe care doriți să-l avertizați',
      type: ApplicationCommandOptionType.Mentionable,
      required: true,
    },
    {
      name: 'reason',
      description: '*Motivul pentru care doriți să-l avertizați',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  permissionsRequired: [PermissionFlagsBits.KickMembers],
  botPermissions: [PermissionFlagsBits.KickMembers],
};

// Funcție helper pentru crearea embed-urilor
function createEmbed(color, title, description = "") {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}
