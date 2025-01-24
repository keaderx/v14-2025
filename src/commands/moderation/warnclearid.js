const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags
} = require('discord.js');
const warnSchema = require('../../models/nwarns-schema');
const adminWarnSchema = require('../../models/admin-warn');

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    const targetUserId = interaction.options.get('target-user').value;
    const warnUUID = interaction.options.get('warn-id').value;

    // Verificăm dacă utilizatorul există pe server
    let targetUser;
    try {
      targetUser = await interaction.guild.members.fetch(targetUserId);
    } catch (error) {
      return interaction.reply({ content: 'Nu am găsit acest utilizator pe server.', flags: MessageFlags.Ephemeral });
    }

    // Căutăm avertismentele utilizatorului în baza de date
    const userWarnings = await warnSchema.findOne({ serverId: interaction.guild.id, memberId: targetUserId });
    const adminWarnings = await adminWarnSchema.findOne({ serverId: interaction.guild.id, memberId: targetUserId });

    if (!userWarnings && !adminWarnings) {
      return interaction.reply({ content: 'Nu există avertismente pentru acest utilizator.', flags: MessageFlags.Ephemeral });
    }

    // Functie pentru a șterge un avertisment
    const removeWarning = async (warnings, warnUUID, schema) => {
      const warningIndex = warnings.findIndex(warning => warning.warnUUID === warnUUID);
      if (warningIndex !== -1) {
        warnings.splice(warningIndex, 1); // Ștergem avertismentul
        await schema.updateOne(
          { serverId: interaction.guild.id, memberId: targetUserId },
          { $pull: { warnings: {warnUUID: warnUUID} },  $inc: {warningsReceived: -1} }
        
        );
        return true;
      }
      return false;
    };

    // Verificăm și ștergem avertismentul
    let removed = false;
    if (userWarnings) {
      removed = await removeWarning(userWarnings.warnings, warnUUID, warnSchema);
    }

    if (!removed && adminWarnings) {
      removed = await removeWarning(adminWarnings.adminwarns, warnUUID, adminWarnSchema);
    }

    if (!removed) {
      return interaction.reply({ content: `Avertismentul cu ID-ul \`${warnUUID}\` nu a fost găsit.`, flags: MessageFlags.Ephemeral });
    }

    // Confirmăm ștergerea
    const successEmbed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('Avertisment șters cu succes')
      .setDescription(`Avertismentul cu ID-ul unic \`${warnUUID}\` a fost șters pentru utilizatorul **${targetUser.displayName}**.`)
      .setTimestamp();

    await interaction.reply({ embeds: [successEmbed] });

    // Trimiterea unui mesaj pe canalul de loguri
    const logChannel = interaction.guild.channels.cache.get('844966132393050119'); // Înlocuiește cu ID-ul canalului de loguri
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('Avertisment șters')
        .setDescription(`**Utilizator:** ${targetUser.displayName}\n**ID-ul avertismentului șters:** \`${warnUUID}\`\n**Acțiune realizată de:** ${interaction.member.displayName}`)
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    } else {
      console.warn('Canalul de loguri nu a fost găsit!');
    }
  },

  name: 'warnclearid',
  description: 'Șterge un avertisment după ID-ul unic al avertismentului',
  options: [
    {
      name: 'target-user',
      description: 'Utilizatorul pentru care vrei să ștergi avertismentul',
      type: ApplicationCommandOptionType.Mentionable,
      required: true,
    },
    {
      name: 'warn-id',
      description: 'ID-ul unic al avertismentului pe care dorești să-l ștergi',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  permissionsRequired: [PermissionFlagsBits.KickMembers],
  botPermissions: [PermissionFlagsBits.KickMembers],
};
