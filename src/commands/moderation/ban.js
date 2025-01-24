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
    const datetime = new Date().toLocaleString('ro-RO', { 
      hour12: false, 
      timeZone: 'Europe/Bucharest' 
    });

    const targetUserId = interaction.options.get('target-user').value;
    const reason = interaction.options.get('reason')?.value || 'Niciun motiv furnizat';

    await interaction.deferReply();

    try {
      const targetUser = await interaction.guild.members.fetch(targetUserId);

      // Verificări de permisiuni și existență
      if (!targetUser) {
        return interaction.editReply({ 
          embeds: [createEmbed("DarkRed", "🙅🏿Utilizatorul respectiv nu există pe acest server")]
        });
      }

      if (targetUser.id === interaction.guild.ownerId) {
        return interaction.editReply({ 
          embeds: [createEmbed("DarkRed", "🙅🏿Nu poți interzice acest utilizator deoarece este proprietarul serverului")]
        });
      }

      if (targetUser.roles.highest.position >= interaction.member.roles.highest.position) {
        return interaction.editReply({
          embeds: [createEmbed("DarkRed", "🙅🏿Nu poți interzice acest utilizator deoarece are același rol sau un rol mai înalt decât al tău")]
        });
      }

      if (targetUser.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.editReply({
          embeds: [createEmbed("DarkRed", "🙅🏿(botperms)Nu pot interzice acest utilizator deoarece are același rol sau un rol mai înalt decât al meu")]
        });
      }

      // Pregătire embed pentru log
      const banLogEmbed = createEmbed("Purple", `${targetUser.displayName} - 🥊A FOST INTERZIS (BAN) DE PE SERVER DE CĂTRE STAFF`, {
        description: `Motiv: ${reason}\nData: ${datetime}`,
        iconURL: targetUser.user.displayAvatarURL({ dynamic: true })
      });

      // Găsește canalul de loguri
      const warningsLogChannel = interaction.guild.channels.cache.get('844966132393050119');
      if (!warningsLogChannel) throw new Error('Canalul de loguri nu a fost găsit!');

      // Trimite log-ul
      await warningsLogChannel.send({ embeds: [banLogEmbed] });

      // Ștergere din baza de date
      await deleteUserData(targetUserId, interaction.guild.id);

      // Log ștergere din baza de date
      const deleteLogEmbed = createEmbed("Red", "🔴 Utilizator șters din baza de date", {
        description: `Datele utilizatorului **${targetUser.displayName}** au fost șterse din baza de date după ce a fost banat.`
      });

      await warningsLogChannel.send({ embeds: [deleteLogEmbed] });

      // Execută banarea
      await targetUser.ban({ days: 7,reason });
      return interaction.editReply({
        embeds: [createEmbed("Purple", `${targetUser.displayName} a fost banat`, {
          iconURL: targetUser.user.displayAvatarURL({ dynamic: true })
        })]
      });

    } catch (error) {
      console.error(error);
      return interaction.editReply({
        embeds: [createEmbed("Red", "❌ Eroare la procesarea comenzii", {
          description: "A apărut o eroare. Te rugăm să încerci din nou mai târziu."
        })]
      });
    }
  },

  name: 'ban',
  description: 'Interzice un membru de pe acest server',
  options: [
    {
      name: 'target-user',
      description: '*Utilizatorul pe care dorești să-l interzici',
      type: ApplicationCommandOptionType.Mentionable,
      required: true,
    },
    {
      name: 'reason',
      description: '*Motivul pentru care dorești să-l interzici',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  permissionsRequired: [PermissionFlagsBits.BanMembers],
  botPermissions: [PermissionFlagsBits.BanMembers],
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

// Funcție helper pentru ștergerea datelor utilizatorului din baza de date
async function deleteUserData(memberId, serverId) {
  await adminWarnSchema.deleteOne({ serverId, memberId });
  await Level.deleteOne({ userId: memberId, guildId: serverId });
  await ktmsSystem.deleteOne({ userId: memberId, guildId: serverId });
  await warnSchema.deleteOne({ serverId, memberId });
}
