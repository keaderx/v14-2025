const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  EmbedBuilder,
} = require('discord.js');
const adminWarnSchema = require('../../models/admin-warn');
const ktmsSystem = require('../../models/ktms-system');
const Level = require('../../models/Level');
const warnSchema = require('../../models/nwarns-schema');

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    // Obține data curentă într-un format mai concis
    const datetime = new Date().toLocaleString('ro-RO', { 
      hour12: false, 
      timeZone: 'Europe/Bucharest' 
    });

    const targetUserId = interaction.options.get('target-user').value;
    const reason = interaction.options.get('reason')?.value || 'Niciun motiv furnizat';

    await interaction.deferReply();

    try {
      const targetUser = await interaction.guild.members.fetch(targetUserId);

      // Verificare existență utilizator
      if (!targetUser) {
        return interaction.editReply({ embeds: [createEmbed("DarkRed", "🙅🏿Utilizatorul respectiv nu există pe acest server")] });
      }

      // Verificare dacă este proprietar serverului
      if (targetUser.id === interaction.guild.ownerId) {
        return interaction.editReply({ embeds: [createEmbed("DarkRed", "🙅🏿Nu poți elimina acest utilizator deoarece este proprietarul serverului")] });
      }

      const targetUserRolePosition = targetUser.roles.highest.position; // Highest role of the target user
      const requestUserRolePosition = interaction.member.roles.highest.position; // Highest role of the user running the cmd
      const botRolePosition = interaction.guild.members.me.roles.highest.position; // Highest role of the bot

      // Verificare roluri utilizator
      if (targetUserRolePosition >= requestUserRolePosition) {
        return interaction.editReply({ embeds: [createEmbed("DarkRed", "🙅🏿Nu poți elimina acest utilizator deoarece are același rol sau un rol mai înalt decât al tău")] });
      }

      // Verificare permisiuni bot
      if (targetUserRolePosition >= botRolePosition) {
        return interaction.editReply({ embeds: [createEmbed("DarkRed", "🙅🏿(botperms)Nu pot elimina acest utilizator deoarece are același rol sau un rol mai înalt decât al meu")] });
      }

      // Pregătire embed pentru log
      const kickLogEmbed = new EmbedBuilder()
        .setColor("Purple")
        .setAuthor({ name: `${targetUser.displayName} - 🥊A FOST ELIMINAT DE PE SERVER DE CĂTRE STAFF`, iconURL: targetUser.user.displayAvatarURL({ dynamic: true }) })
        .setDescription(`Motiv: ${reason}\nData: ${datetime}`);

      // Găsește canalul de loguri
      const warningsLogChannel = interaction.guild.channels.cache.get('844966132393050119');
      if (!warningsLogChannel) throw new Error('Canalul de loguri nu a fost găsit!');

      // Trimite log-ul de kick
      await warningsLogChannel.send({ embeds: [kickLogEmbed] });

      // Ștergere utilizator din baza de date
      const serverId = interaction.guild.id;
      const memberId = targetUserId;
      await adminWarnSchema.deleteOne({ serverId, memberId });
      await Level.deleteOne({ userId: memberId, guildId: serverId });
      await ktmsSystem.deleteOne({ userId: memberId, guildId: serverId });
      await warnSchema.deleteOne({ serverId, memberId });

      // Log pentru ștergerea din baza de date
      const deleteLogEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("🔴 Utilizator șters din baza de date")
        .setDescription(`Datele utilizatorului **${targetUser.displayName}** au fost șterse din baza de date după ce a fost eliminat (kick).`);

      await warningsLogChannel.send({ embeds: [deleteLogEmbed] });

      // Execută kick-ul
      // await targetUser.kick({ reason });

      // Răspunde utilizatorului cu embed-ul de kick
      await interaction.editReply({ embeds: [createEmbed("Purple", `${targetUser.displayName} a fost eliminat de pe server`, { iconURL: targetUser.user.displayAvatarURL({ dynamic: true }) })] });

    } catch (error) {
      console.error(error);
      return interaction.editReply({
        embeds: [createEmbed("Red", "❌ Eroare la procesarea comenzii", { description: "A apărut o eroare. Te rugăm să încerci din nou mai târziu." })]
      });
    }
  },

  name: 'kick',
  description: 'Elimină un membru de pe acest server',
  options: [
    {
      name: 'target-user',
      description: '*Utilizatorul pe care dorești să-l elimini',
      type: ApplicationCommandOptionType.Mentionable,
      required: true,
    },
    {
      name: 'reason',
      description: '*Motivul pentru care dorești să-l elimini',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  permissionsRequired: [PermissionFlagsBits.KickMembers],
  botPermissions: [PermissionFlagsBits.KickMembers],
};

// Funcție helper pentru crearea embed-urilor
function createEmbed(color, title, options = {}) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title);
  
  if (options.description) embed.setDescription(options.description);
  if (options.iconURL) embed.setAuthor({ name: title, iconURL: options.iconURL });

  return embed;
}
