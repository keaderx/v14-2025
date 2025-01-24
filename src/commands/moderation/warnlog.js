const {
    Client,
    Interaction,
    ApplicationCommandOptionType,
    EmbedBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');
const warnSchema = require('../../models/nwarns-schema');
const adminWarnSchema = require('../../models/admin-warn'); // presupunem că ai un schema pentru adminwarn

module.exports = {
    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const targetUserId = interaction.options.get('target-user').value;

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

        if ((!userWarnings || userWarnings.warnings.length === 0) && (!adminWarnings || adminWarnings.adminwarns.length === 0)) {
            return interaction.reply({ content: 'Acest utilizator nu are niciun avertisment în baza de date.', flags: MessageFlags.Ephemeral });
        }

        // Creăm embed-ul pentru a afișa avertismentele
        const warningsEmbed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle(`Avertismente pentru ${targetUser.displayName}`)
            .setDescription(`Detalii despre avertismentele utilizatorului **${targetUser.displayName}**:`)
            .setTimestamp();

        // Adăugăm avertismentele normale
        if (userWarnings && userWarnings.warnings.length > 0) {
            userWarnings.warnings.forEach((warning, index) => {
                warningsEmbed.addFields({
                    name: `Avertisment #${index + 1}`,
                    value: `**Motiv:** ${warning.motiv}\n**Data:** ${warning.data}\n**ID unic:** ${warning.warnUUID}`,
                    inline: false,
                });
            });
        }

        // Adăugăm avertismentele administrative (adminwarn)
        if (adminWarnings && adminWarnings.adminwarns.length > 0) {
            adminWarnings.adminwarns.forEach((warning, index) => {
                warningsEmbed.addFields({
                    name: `Admin Avertisment #${index + 1}`,
                    value: `**Motiv:** ${warning.motiv}\n**Data:** ${warning.data}\n**ID unic:** ${warning.warnUUID}`,
                    inline: false,
                });
            });
        }

        // Trimitere embed cu avertismentele utilizatorului
        await interaction.reply({ embeds: [warningsEmbed], flags: MessageFlags.Ephemeral });
    },

    name: 'warnlog',
    description: 'Vizualizează avertismentele unui utilizator (inclusiv adminwarn)',
    options: [
        {
            name: 'target-user',
            description: 'Utilizatorul pentru care vrei să vizualizezi avertismentele',
            type: ApplicationCommandOptionType.Mentionable,
            required: true,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.KickMembers],
    botPermissions: [PermissionFlagsBits.KickMembers],
};
