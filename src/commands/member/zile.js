const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    if (!interaction.inGuild()) {
      return interaction.reply('Poți utiliza această comandă exclusiv în interiorul serverului');
    }

    await interaction.deferReply();

    const mentionedUserId = interaction.options.get('target-user')?.value;
    const targetUserId = mentionedUserId || interaction.member.id;

    // Verifică dacă utilizatorul există în cache
    const targetUser = await interaction.guild.members.fetch(targetUserId).catch(() => null);

    if (!targetUser) {
      const userTargetEmbed = new EmbedBuilder()
        .setColor("DarkRed")
        .setTitle("🙅🏿 Utilizatorul respectiv nu există pe acest server");
      return interaction.editReply({embeds: [userTargetEmbed]});
    }

    // Calcularea zilelor de când utilizatorul a intrat pe server
    const joinedTime = Date.now() - targetUser.joinedAt.getTime();
    const joinedDays = Math.floor(joinedTime / 86400000);  // 86400000 este numărul de milisecunde într-o zi

    // Crearea embed-ului cu informațiile
    const zileEmbed = new EmbedBuilder()
      .setAuthor({
        name: `${targetUser.displayName} - [${joinedDays}] ZILE`,
        iconURL: targetUser.user.displayAvatarURL({ dynamic: true }),
      })
      .setColor(targetUser.displayHexColor || 'RANDOM')
      .setTimestamp(); // Optionally add a timestamp

    await interaction.editReply({ embeds: [zileEmbed] });
  },

  name: 'zile',
  description: "Zile totale pe server",
  options: [
    {
      name: 'target-user',
      description: 'Utilizatorul ale cărui zile vrei să le vezi',
      type: ApplicationCommandOptionType.Mentionable,
      required: false, // Make this optional
    },
  ],
};
