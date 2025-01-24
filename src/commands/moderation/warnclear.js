const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  EmbedBuilder,
} = require('discord.js');

const warnSchema = require('../../models/nwarns-schema')

// const warnUid = function(){
//     return Date.now().toString(36) + Math.random().toString(36).substr(2);
// }




module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */

  callback: async (client, interaction) => {


    const targetUserId = interaction.options.get('target-user').value;

    await interaction.deferReply();

    const targetUser = await interaction.guild.members.fetch(targetUserId);

    const serverId = interaction.guild.id
    const memberId = targetUserId

    const userBotEmbed = new EmbedBuilder()
    .setColor("DarkRed")
    .setTitle("🙅🏿Nu poți avertiza un BOT")

    if (targetUser.user.bot) {
      await interaction.editReply({embeds: [userBotEmbed]});
      return;
    }
    
    const userDontExistEmbed = new EmbedBuilder()
    .setColor("DarkRed")
    .setTitle("🙅🏿Acest utilizator nu există pe acest server")

    if (!targetUser) {
      await interaction.editReply({embeds: [userDontExistEmbed]});
      return;
    }

    const userOwnerEmbed = new EmbedBuilder()
    .setColor("DarkRed")
    .setTitle("🙅🏿Nu poți folosi această  comandă pe proprietarul serverului.")

    if (targetUser.id === interaction.guild.ownerId) {
      await interaction.editReply({embeds: [userOwnerEmbed]});
      return;
    }

    const targetUserRolePosition = targetUser.roles.highest.position; // Highest role of the target user
    const requestUserRolePosition = interaction.member.roles.highest.position; // Highest role of the user running the cmd
    const botRolePosition = interaction.guild.members.me.roles.highest.position; // Highest role of the bot
    
    const userHighSameRoleEmbed = new EmbedBuilder()
    .setColor("DarkRed")
    .setTitle("🙅🏿Nu poți șterge avertismentele acestui utilizator pentru că are același rol/mai mare decât tine")

    if (targetUserRolePosition >= requestUserRolePosition) {
      await interaction.editReply({embeds: [userHighSameRoleEmbed]});
      return;
    }

    const botHighSameRoleEmbed = new EmbedBuilder()
    .setColor("DarkRed")
    .setTitle("🙅🏿(BOT PERMS)Nu pot șterge avertismentele acestui utilizator pentru că are același rol/mai mare decât mine.")

    if (targetUserRolePosition >= botRolePosition) {
      await interaction.editReply({embeds: [botHighSameRoleEmbed]});
      return;
    }

    const noWarnsUser = await warnSchema.findOne(
        {
        serverId,
        memberId,
        },
        {
            serverId,
            memberId,
            warningsReceived: -1,
        }
    )

    const noWarningsEmbed = new EmbedBuilder()
    .setColor("DarkRed")
    .setTitle("🙅🏿Acest utilizator nu are niciun avertisment înregistrat")

    const warnCheckZero = await noWarnsUser.warningsReceived


    if(warnCheckZero === 0) {
        await interaction.editReply({embeds: [noWarningsEmbed]});
      return;
       
    }



    const messageCallBack = new EmbedBuilder()
    .setAuthor({name: `${targetUser.displayName} - I-AU FOST ȘTERSE AVERTISMENTELE DE CĂTRE STAFF❗`, iconURL: `${targetUser.user.displayAvatarURL({dynamic: true})}`})
    .setColor("DarkNavy")

    interaction.editReply({embeds: [messageCallBack]})


    
       var currentdate = new Date(); 
       var datetime = "" + currentdate.getDate() + "/"
       + (currentdate.getMonth()+1)  + "/" 
       + currentdate.getFullYear() + " @ "  
       + currentdate.getHours() + ":"  
       + currentdate.getMinutes() + ":" 
       + currentdate.getSeconds();
  
         const userWarnings = await warnSchema.findOneAndUpdate(
            {
              serverId,
              memberId,
            },
            {
              serverId,
              memberId,
              $set: {
                  warningsReceived: 0,
                },
            },
          )

  

    const getUserWarnings = await userWarnings.warningsReceived

    const warningsLogChannel = interaction.guild.channels.cache.get('844966132393050119')

    const warningsLogChannelEmbed = new EmbedBuilder()
    .setColor("DarkNavy")
    .setAuthor({name: `${targetUser.displayName}  AVERTISMENTELE AU FOST STERSE`, iconURL: `${targetUser.user.displayAvatarURL({dynamic: true})}`})
    .setDescription(`\n> **STAFF ┊ ${interaction.member.displayName}**\n\n> **DATA ┊ ${datetime}**`)
    
    warningsLogChannel.send({embeds: [warningsLogChannelEmbed]})
  },

  name: 'warnclear',
  description: 'Ștergeți Toate Avertismentele',
  options: [
    {
      name: 'target-user',
      description: '*Utilizatorul caruia doriți să-i ștergeți avertismentele',
      type: ApplicationCommandOptionType.Mentionable,
      required: true,
    },  
  ],
  permissionsRequired: [PermissionFlagsBits.BanMembers],
  botPermissions: [PermissionFlagsBits.BanMembers],
};
