const { Client, Interaction, EmbedBuilder, ApplicationCommandOptionType, PermissionFlagsBits, MessageFlags } = require('discord.js');
const ktmsSystem = require('../../models/ktms-system');
const levelSystem = require('../../models/Level');

module.exports = {
    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        // Preluăm utilizatorul pentru care se face comanda
        const targetUser = interaction.options.getUser('user') || interaction.user;

        // Căutăm datele utilizatorului în baza de date
        const ktmsData = await ktmsSystem.findOne({ userId: targetUser.id });
        const levelData = await levelSystem.findOne({ userId: targetUser.id });
        const getRespect = ktmsData.ktmsrespect

              // Determinăm nivelul de respect
              let showRespect;
              if (getRespect <= 400) showRespect = '👎 LOW-RESPECTED';
              else if (getRespect <= 4000) showRespect = '👍 MEDIUM-RESPECTED';
              else if (getRespect <= 14998) showRespect = '💪 HIGH-RESPECTED';
              else if (getRespect >= 15000) showRespect = '🌟 ULTRA-RESPECTED';
              else showRespect = '❓';

        const member = await interaction.guild.members.fetch(targetUser.id);
        const joinDate = member.joinedAt; // Data la care utilizatorul s-a alăturat serverului

        // Calculăm zilele pe server
        const currentDate = new Date();
        const diffTime = Math.abs(currentDate - joinDate);
        const daysOnServer = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Calculăm diferența în zile

        // Verificăm dacă utilizatorul are date în baza de date
        if (!ktmsData || !levelData) {
            return interaction.reply({ content: `Nu am găsit datele pentru utilizatorul **${targetUser.tag}**`, flags: MessageFlags.Ephemeral });
        }

        // Construim embed-ul
        const embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle(`Stats pentru ${targetUser.tag}`)
            .setThumbnail(targetUser.displayAvatarURL())
            .setDescription('Informații detaliate despre utilizatorul ales:')
            .addFields(
                {
                    name: '🏅 Nivelul:',
                    value: `Nivelul curent: **${levelData.level}**`,
                    inline: false
                },

                {
                    name: '📊 KTMS Sistem:',
                    value: `KTMS ENERGY: **${ktmsData.ktmsenergy}**\nKTMS RESPECT POINTS: ${ktmsData.ktmsrespect}\nKTMS RESPECT: **${showRespect}**`,
                    inline: false
                },
                {
                  name: '📅 Zile pe server:',
                  value: `**${daysOnServer} zile** petrecute pe server. 🎉`,
                  inline: false
                }
                
            )
            .setFooter({ text: 'Statistici actualizate automat.' })
            .setTimestamp();

        // Trimitem embed-ul cu statisticile utilizatorului
        await interaction.reply({ embeds: [embed] });
    },

    name: 'stats',
    description: 'Vezi statistici detaliate pentru un utilizator (inclusiv nivel și puncte KTMS)',
    options: [
        {
            name: 'user',
            description: 'Utilizatorul pentru care vrei să vezi statisticile',
            type: ApplicationCommandOptionType.User,
            required: false
        }
    ],
    permissionsRequired: [PermissionFlagsBits.KickMembers],
    botPermissions: [PermissionFlagsBits.KickMembers],
};
