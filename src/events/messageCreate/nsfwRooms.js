const { Client, Message, EmbedBuilder, MessageFlags, ChannelType } = require('discord.js');
/**
 *
 * @param {Client} client
 * @param {Message} message
 */
module.exports = async (client, message) => {
    
      // ID-urile canalelor
      const sourceChannelId = '844966132393050121'; // Camera unde verificăm mesajele
      const targetChannelId = '844966132649426984'; // Camera unde retrimitem atașamentele
      const staffRole = '844966132393050113'
    
      // Ignorăm mesajele de la boti
      if (message.author.bot) return;
    
      // Verificăm dacă mesajul a fost trimis în canalul sursă
      if (message.channel.id === sourceChannelId) {
        
        if(message.member.roles.cache.has(staffRole)) {
            return;
        }
        // Verificăm dacă mesajul conține atașamente
        if (message.attachments.size > 0) {
          // Filtrăm atașamentele pentru imagini și videoclipuri
          const validAttachments = message.attachments.filter((attachment) =>
            attachment.contentType?.startsWith('image/') || attachment.contentType?.startsWith('video/')
          );
    
          if (validAttachments.size > 0) {
            const targetChannel = client.channels.cache.get(targetChannelId);
    
            if (targetChannel && targetChannel.type === ChannelType.GuildText) {
              for (const attachment of validAttachments.values()) {
                await targetChannel.send({
                  content: `📤 Mesaj Inregistrat De La ${message.author.tag}:`,
                  files: [attachment],
                });
              }
            }
          }
        } else {
            const embedErr = new EmbedBuilder()
            .setAuthor({name: `❌ ${message.member.displayName} Doar atașamente de tip imagine sau video sunt permise în ${message.channel.name}`, iconURL: `${message.member.displayAvatarURL({dynamic: true})}`})
            .setColor("#f5ed00")
          // Ștergem mesajele care conțin doar text
          await message.delete();
          await message.member.send({
            embeds: [embedErr]
          });
        }
      
    }  
};
