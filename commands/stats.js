const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const timestamp = require('time-stamp');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Statistiques à propos des VMs')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const jsonData = fs.readFileSync('./data/vms.json');
        existingData = JSON.parse(jsonData);
        let journalier = 0
        let mensuel = 0

        for (let i = 0; i < existingData.vms.length; i++) {
            var jour = existingData.vms[i].date.split("/",3);
            if(existingData.vms[i].date == timestamp('DD/MM/YYYY')){
                journalier = journalier + 1
            }
            if(jour[1] + "/" + jour[2] == timestamp('MM/YYYY')){
                mensuel = mensuel + 1
            }
        }

        const Embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Statistiques')
            .addFields(
                { name: 'Journalier', value: `${journalier}`, inline: true },
                { name: 'Mensuel', value: `${mensuel}`, inline: true },
                { name: 'Total', value: `${existingData.vms.length}`, inline: true },
            )
            .setTimestamp()

        interaction.reply({ embeds: [Embed] });

    },
};