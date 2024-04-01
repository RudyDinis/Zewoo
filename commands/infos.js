const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const axios = require('axios').default;
const fs = require('fs');
const https = require('https');
axios.defaults.httpsAgent = new https.Agent({ rejectUnauthorized: false });
const { PROXMOX_API_URL, USERNAME, PASSWORD, NODE } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('infos')
        .setDescription('Infos sur un Vm')
        .addStringOption(option =>
            option.setName('vmid')
                .setRequired(true)
                .setDescription("ID de la vm"))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const le = interaction.options.getString('vmid');

        async function main() {
            try {
                // Étape 1 : Authentification pour obtenir un token
                const response = await axios.post(
                    `${PROXMOX_API_URL}/access/ticket`,
                    {
                        username: USERNAME,
                        password: PASSWORD,
                    },
                    { withCredentials: true }
                );

                const token = response.data.data.ticket;

                // Étape 2 : Récupération des caractéristiques de la VM
                const vmResponse = await axios.get(
                    `${PROXMOX_API_URL}/nodes/${NODE}/qemu/${VMID}/config`,
                    {
                        headers: {
                            Cookie: `PVEAuthCookie=${token}`,
                        },
                    }
                );

                const vmConfig = vmResponse.data.data; // Les caractéristiques de la VM sont stockées dans l'objet vmConfig

                const cpuResponse = await axios.get(
                    `${PROXMOX_API_URL}/nodes/${NODE}/qemu/${VMID}/status/current`,
                    {
                      headers: {
                        Cookie: `PVEAuthCookie=${token}`,
                      },
                    }
                  );
              
                const cpuInfo = cpuResponse.data.data;

                const embed = new EmbedBuilder()
                .setColor("00BFFF")
                .setTitle("infos de la Vm : " + VMID)
                .setDescription(
                "Status : " + cpuInfo.status + "\n"
                + "cpu : " + cpuInfo.cpu + "% \n"
                + "Ram : " + cpuInfo.mem + " / " + vmConfig.memory + "Mo\n"
                + "Stockage : " + cpuInfo.disk + " / " + cpuInfo.maxdisk / 1000000000 + "Go\n")
                .setTimestamp()

                interaction.reply({ embeds: [embed] })

            } catch (error) {
                interaction.reply("Êtes vous sûr d'avoir entrez la bonne VmID ?")
            }
        }

        main();
    },
};