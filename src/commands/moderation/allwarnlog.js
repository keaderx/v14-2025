const {
    Client,
    Interaction,
    ApplicationCommandOptionType,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    MessageFlags,
    PermissionFlagsBits
} = require('discord.js');
const warnSchema = require('../../models/nwarns-schema');
const adminWarnSchema = require('../../models/admin-warn');

module.exports = {
    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        // Căutăm toate avertismentele pentru toți utilizatorii din baza de date
        const userWarnings = await warnSchema.find({ serverId: interaction.guild.id });
        const adminWarnings = await adminWarnSchema.find({ serverId: interaction.guild.id });

        // Combina avertismentele normale și cele administrative
        const allWarnings = [];
        
        userWarnings.forEach((user) => {
            user.warnings.forEach((warning) => {
                allWarnings.push({
                    userId: user.memberId,
                    warnUUID: warning.warnUUID,
                    motiv: warning.motiv,
                    data: warning.data,
                    type: 'User',
                });
            });
        });

        adminWarnings.forEach((admin) => {
            admin.adminwarns.forEach((warning) => {
                allWarnings.push({
                    userId: admin.memberId,
                    warnUUID: warning.warnUUID,
                    motiv: warning.motiv,
                    data: warning.data,
                    type: 'Admin',
                });
            });
        });

        if (allWarnings.length === 0) {
            return interaction.reply({ content: 'Nu sunt avertismente înregistrate în baza de date.', flags: MessageFlags.Ephemeral });
        }

        let currentPage = 0;

        // Funcție pentru a crea embed-ul cu avertismentele pentru pagina curentă
        const createWarningsEmbed = (page) => {
            const warningsPerPage = 5;
            const start = page * warningsPerPage;
            const end = start + warningsPerPage;
            const pageWarnings = allWarnings.slice(start, end);

            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle(`Toate avertismentele din server`)
                .setDescription('Lista completă a avertismentelor înregistrate pe server:')
                .setTimestamp();

            pageWarnings.forEach((warning, index) => {
                embed.addFields({
                    name: `Avertisment #${start + index + 1}`,
                    value: `**Utilizator:** <@${warning.userId}>\n**Motiv:** ${warning.motiv}\n**Data:** ${warning.data}\n**ID unic:** ${warning.warnUUID}\n**Tip:** ${warning.type}`,
                    inline: false,
                });
            });

            return embed;
        };

        // Creați butoanele pentru navigare
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('previous')
                .setLabel('Anterior')
                .setStyle('Primary')
                .setDisabled(currentPage === 0), // Dezactivează butonul "Anterior" dacă suntem la prima pagină
            new ButtonBuilder()
                .setCustomId('next')
                .setLabel('Următor')
                .setStyle('Primary')
                .setDisabled(currentPage >= Math.ceil(allWarnings.length / 5) - 1) // Dezactivează butonul "Următor" dacă suntem la ultima pagină
        );

        // Răspundem cu embed-ul și butoanele
        await interaction.reply({
            embeds: [createWarningsEmbed(currentPage)],
            components: [row]
        });

        // Gestionăm interacțiunile cu butoanele
        const filter = (i) => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (i) => {
            if (i.customId === 'previous' && currentPage > 0) {
                currentPage--;
            } else if (i.customId === 'next' && currentPage < Math.ceil(allWarnings.length / 5) - 1) {
                currentPage++;
            }

            // Creăm un nou embed cu avertismentele corespunzătoare paginii curente
            const newEmbed = createWarningsEmbed(currentPage);

            // Creăm din nou butoanele
            const newRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('Anterior')
                    .setStyle('Primary')
                    .setDisabled(currentPage === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Următor')
                    .setStyle('Primary')
                    .setDisabled(currentPage >= Math.ceil(allWarnings.length / 5) - 1)
            );

            // Actualizăm mesajul cu noul embed și butoane
            await i.update({
                embeds: [newEmbed],
                components: [newRow]
            });
        });

        collector.on('end', () => {
            // Dezactivăm butoanele după ce colectarea s-a încheiat
            row.components.forEach(button => button.setDisabled(true));
            interaction.editReply({ components: [row] });
        });
    },

    name: 'allwarnlog',
    description: 'Vizualizează toate avertismentele din server (utilizatori și admini)',
    permissionsRequired: [PermissionFlagsBits.KickMembers],
    botPermissions: [PermissionFlagsBits.KickMembers],
};
