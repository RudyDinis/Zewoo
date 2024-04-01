const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const axios = require('axios').default;
const fs = require('fs');
const https = require('https');
const { data } = require('./infos');
const { PROXMOX_API_URL, USERNAME, PASSWORD, NODE, VMID_TO_CLONE } = require('../config.json');
const timestamp = require('time-stamp');
axios.defaults.httpsAgent = new https.Agent({ rejectUnauthorized: false });

function getDataFromAPI(data) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(data);
    }, 2000);
  });
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName('clonage')
        .setDescription('Cloner une VMs'),
    async execute(interaction) {
        // mdp aléatoire
        function generateRandomPassword(length) {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&'()*+,-./:;=?@[^_`{|}~";
            let password = '';
            for (let i = 0; i < length; i++) {
              password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return password;
        }

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

            const jsonData = fs.readFileSync('./config.json');
				    existingData = JSON.parse(jsonData);

            const token = response.data.data.ticket;
            const CSRFPreventionToken = response.data.data.CSRFPreventionToken;
            // Étape 2 : Clonage de la VM
            const username = interaction.user.id;
            const password = generateRandomPassword(14);

            const NewVMuser = await axios.post(
              `${PROXMOX_API_URL}/access/users`,
              {
                enable: 1,
                firstname: username,
                expire: '0',
                userid: username + '@pve',
                password: password,
              },
              {
                headers: {
                  Cookie: `PVEAuthCookie=${token}`,
                  CSRFPreventionToken: CSRFPreventionToken,
                },
              }
            ).catch((error) => {
              return "user"
            });

            if(NewVMuser == "user") {
              return "user0"
            } else {
              await axios.post(
                `${PROXMOX_API_URL}/nodes/${NODE}/qemu/${VMID_TO_CLONE}/clone`,
                {
                  newid: Number(existingData.vmid) + 1, // Nouvel ID de la VM clonée (ajustez selon vos besoins)
                },
                {
                  headers: {
                    Cookie: `PVEAuthCookie=${token}`,
                    CSRFPreventionToken: CSRFPreventionToken,
                  },
                }
              ).catch((error) => {
                console.error('Erreur lors de la requête Axios pour le clonage :', error.message || error);
              });
      
              existingData.vmid = Number(existingData.vmid) + 1
              
              const combinedDataJSON = JSON.stringify(existingData, null, 2);
              fs.writeFileSync('./config.json', combinedDataJSON);
          
              // Étape 2 : Attribution de l'utilisateur à la VM
              await axios.put(
                `${PROXMOX_API_URL}/access/acl`,
                {
                  path: `/vms/${existingData.vmid}`,
                  users: username + '@pve',
                  roles: 'Administrator',
                },
                {
                  headers: {
                    Cookie: `PVEAuthCookie=${token}`,
                    CSRFPreventionToken: CSRFPreventionToken,
                  },
                }
              ).catch((error) => {
                return "acces"
              });
              return ([username, password, existingData.vmid])
            }
        
          } catch (error) {
            console.error('Une erreur s\'est produite :', error.message || error);
          }
        }

        try {
            getDataFromAPI(main()).then((data) => {
              if(data == "user0"){
                interaction.reply("Vous avez déjà une vm.")
              } else {
                interaction.reply("Nous vous avons envoyez vos identifiant en message privé.")
                interaction.user.send(`voici vos identifiants : \n Utilisateur : ${data[0]}@pve \n Mot de passe : \`${data[1]}\` \n VmID : ${data[2]}`)
                const newData = {
                  "user": `${data[0]}@pve`,
                  "VmID": data[2],
                  "date": timestamp('DD/MM/YYYY')
                };

                const jsonData = fs.readFileSync('./data/vms.json');
                existingData = JSON.parse(jsonData);

                existingData.vms.push(newData);

                const combinedDataJSON = JSON.stringify(existingData, null, 2);
			
                fs.writeFileSync('./data/vms.json', combinedDataJSON);
              }
            })
        } catch (error) {
            interaction.reply("Une erreur est survenue, vos messages privé sont ils ouvert ?")
        }


    },
};