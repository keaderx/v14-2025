const { Client, Interaction, ApplicationCommandOptionType } = require('discord.js');
const User = require('../../models/User');

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    // if (!interaction.inGuild()) {
    //   interaction.reply({
    //     content: 'You can only run this command inside a server.',
    //     ephemeral: true,
    //   });
    //   return;
    // }

    // const targetUserId = interaction.options.get('user')?.value || interaction.member.id;

    // await interaction.deferReply();

    // const user = await User.findOne({ userId: targetUserId, guildId: interaction.guild.id });

    // if (!user) {
    //   interaction.editReply(`<@${targetUserId}> doesn't have a profile yet.`);
    //   return;
    // }

    // interaction.editReply(
    //   targetUserId === interaction.member.id
    //     ? `Your balance is **${user.balance}**`
    //     : `<@${targetUserId}>'s balance is **${user.balance}**`
    // );

    
    await interaction.deferReply()
    await interaction.editReply("CURAND")
    
  },

  name: 'balance',
  description: "CURAND",
  // options: [
  //   {
  //     name: 'user',
  //     description: 'CURAND',
  //     type: ApplicationCommandOptionType.User,
  //   },
  // ],
};
