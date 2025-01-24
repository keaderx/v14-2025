const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  EmbedBuilder,
  MessageFlags
} = require('discord.js');
const ktmsSystem = require('../../models/ktms-system');
const ms = require('parse-ms').default;

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    try {
      if (!interaction.inGuild()) {
        return interaction.reply({ content: 'Doar in interiorul server-ului', flags: MessageFlags.Ephemeral });
      }

      const targetUserId = interaction.options.get('target-user').value;
      const targetUser = await interaction.guild.members.fetch(targetUserId).catch(() => null);
      const memberUserId = interaction.member.id;
      const serverId = interaction.guild.id;
      const time = Date.now();
      const timeout = 3600000; // 1 hour timeout

      // Prevent user from targeting themselves
      if (targetUserId === memberUserId) {
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor('DarkRed').setTitle('🙅🏿Nu poți utiliza această comandă asupra ta')],
          flags: MessageFlags.Ephemeral,
        });
      }

      // Check if the target user exists
      if (!targetUser) {
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor('DarkRed').setTitle('🙅🏿Utilizatorul respectiv nu există pe acest server')],
          flags: MessageFlags.Ephemeral,
        });
      }

      // Prevent targeting bots
      if (targetUser.user.bot) {
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor('DarkRed').setTitle('🙅🏿Nu folosi această comandă pe un BOT')],
          flags: MessageFlags.Ephemeral,
        });
      }

      // Fetch or create user data
      const memberData = (await ktmsSystem.findOne({ userId: memberUserId, guildId: serverId })) ||
        new ktmsSystem({ guildId: serverId, userId: memberUserId });
      const targetData = (await ktmsSystem.findOne({ userId: targetUserId, guildId: serverId })) ||
        new ktmsSystem({ guildId: serverId, userId: targetUserId });

      // Check if the user has the role that bypasses the cooldown
      const bypassRoleId = '844966132393050113';
      if (!interaction.member.roles.cache.has(bypassRoleId) && time - memberData.lastGave < timeout) {
        const remainingTime = ms(timeout - (time - memberData.lastGave));
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('DarkRed')
              .setAuthor({
                name: `${interaction.member.displayName}, poți utiliza această comandă din nou în ${remainingTime.hours || 0}:${remainingTime.minutes || 0}:${remainingTime.seconds || 0}`,
                iconURL: interaction.member.displayAvatarURL({ dynamic: true }),
              }),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }

      // Define energy increase based on roles
      let energyIncrease = 1; // Default value

      // Check roles and set energyIncrease accordingly
      if (interaction.member.roles.cache.has('844966132393050113')) {
        energyIncrease = 4; // Admin
      } else if (interaction.member.roles.cache.has('844966132393050112')) {
        energyIncrease = 3; // Guardian
      } else if (interaction.member.roles.cache.has('844966132003635209')) {
        energyIncrease = 2; // Staff
      }

      // Update energy and respect
      memberData.lastGave = time;
      targetData.ktmsenergy += energyIncrease;

      await memberData.save();
      await targetData.save();

      // Determine respect level
      let respectLevel;
      let emoji;
      if (targetData.ktmsrespect <= 400) {
        respectLevel = 'LOW-RESPECTED';
        emoji = '😶';
      } else if (targetData.ktmsrespect <= 1000) {
        respectLevel = 'MEDIUM-RESPECTED';
        emoji = '🙂';
      } else if (targetData.ktmsrespect <= 5000) {
        respectLevel = 'HIGH-RESPECTED';
        emoji = '😎';
      } else if (targetData.ktmsrespect > 15000) {
        respectLevel = 'SUPER-RESPECTED';
        emoji = '🔥';
      } else {
        respectLevel = 'UNKNOWN';
        emoji = '❓';
      }

      // Create response embed
      const responseEmbed = new EmbedBuilder()
        .setColor(targetUser.displayHexColor || 'Random')
        .setAuthor({
          name: `${targetUser.displayName} [+${energyIncrease}] KTMS ENERGY`,
          iconURL: targetUser.user.displayAvatarURL({ dynamic: true }),
        })
        .addFields(
          { name: 'KTMS ENERGY 🔋', value: `${targetData.ktmsenergy}`, inline: true },
          { name: 'KTMS LEVEL ⬆️', value: `${targetData.ktmslevel || 0}`, inline: true },
          { name: 'KTMS RESPECT 🙌', value: `${emoji} ${respectLevel}`, inline: true }
        );

      // Add a field to mention the energy bonus based on the user's role
      const roleName = interaction.member.roles.cache.has('844966132393050113') ? 'Admin' :
                       interaction.member.roles.cache.has('844966132393050112') ? 'Guardian' : 
                       interaction.member.roles.cache.has('844966132003635209') ? 'Staff' : null;

      if (roleName) {
        responseEmbed.addFields(
          { name: `${roleName} BONUS ⚡`, value: `Ai primit ${energyIncrease} puncte KTMS ENERGY datorită rolului ${roleName} (${interaction.member.displayName})`, inline: false }
        );
      }

      interaction.reply({ embeds: [responseEmbed] });
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'A apărut o eroare. Încearcă din nou mai târziu.', flags: MessageFlags.Ephemeral });
    }
  },

  name: 'ktms',
  description: 'Level up reputația unui membru (+Ktms energy 🔥)',
  options: [
    {
      name: 'target-user',
      description: 'Utilizatorul căruia dorești să-i crești nivelul reputației',
      type: ApplicationCommandOptionType.Mentionable,
      required: true,
    },
  ],
};
