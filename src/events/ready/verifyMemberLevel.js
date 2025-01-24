const { Client, EmbedBuilder } = require('discord.js');
const Level = require('../../models/Level'); // Asumăm că schema Level este salvată în 'models/Level.js'

module.exports = (client) => {
  // Intervalul de actualizare (12 ore)
  const interval = 12 * 60 * 60 * 1000; // 15 secunde pentru testare, schimbă la 12 ore în producție

  // Verifică periodic membrii serverului și calculează nivelul pe baza zilelor
  setInterval(async () => {
    client.guilds.cache.forEach(async (guild) => {
      const members = await guild.members.fetch();

      for (const member of members.values()) {
        // Exclude boturile
        if (member.user.bot) {
          continue;
        }

        const joinedTime = Date.now() - member.joinedAt.getTime();
        const joinedDays = Math.floor(joinedTime / 86400000);

        // Calculăm nivelul pe baza zilelor
        const calculatedLevel = Math.floor(joinedDays / 3); // 1 nivel pentru fiecare 3 zile
        await updateLevel(member, guild.id, calculatedLevel, joinedDays);
        await assignRoleBasedOnDays(member, joinedDays); // Atribuie roluri pe baza zilelor
      }
    });
  }, interval);
};

// Funcție pentru actualizarea nivelului în baza de date
async function updateLevel(member, guildId, calculatedLevel, joinedDays) {
  let userLevel = await Level.findOne({ userId: member.id, guildId });

  if (!userLevel) {
    // Dacă utilizatorul nu există, creează o intrare nouă
    userLevel = new Level({
      userId: member.id,
      guildId,
      xp: calculatedLevel * 10, // Calculăm XP-ul în funcție de nivel
      level: calculatedLevel,
      messageSent: false, // Adăugăm un câmp pentru a urmări dacă mesajul a fost trimis
    });
  } else {
    // Actualizează nivelul și XP-ul
    userLevel.xp = calculatedLevel * 10; // XP în funcție de nivel
    userLevel.level = calculatedLevel;
  }

  await userLevel.save();

  // Trimite mesaj doar dacă nu a fost deja trimis
  if (!userLevel.messageSent) {
    await sendLevelMessage(member, calculatedLevel, joinedDays);
    // Actualizează câmpul messageSent pentru a evita trimiterea repetată
    userLevel.messageSent = true;
    await userLevel.save();
  }
}

// Funcție pentru trimiterea unui mesaj privat utilizatorului
async function sendLevelMessage(member, calculatedLevel, joinedDays) {
  try {
    // Crează embed-ul pentru mesajul de felicitare
    const embed = new EmbedBuilder()
      .setColor('#4CAF50') // Setează culoarea embed-ului (verde pentru felicitări)
      .setTitle('🎉 Felicitări! 🎉')
      .setDescription(`Ai ajuns la **nivelul ${calculatedLevel}** pe serverul nostru! 🎉`)
      .addFields(
        { name: 'Zile de activitate', value: `${joinedDays} zile`, inline: true },
        { name: 'Nivelul tău', value: `${calculatedLevel}`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Mulțumim că ești parte din comunitatea noastră!' });

    // Trimite mesajul embed în privat doar o singură dată
    await member.send({ embeds: [embed] });
    console.log(`MESAJ TRIMIS LUI: ${member.user.tag}`)
  } catch (error) {
    console.log(`Nu am putut trimite mesaj privat lui ${member.user.tag}: ${error.message}`);
  }
}

// Funcție pentru atribuirea de roluri pe baza zilelor de activitate
async function assignRoleBasedOnDays(member, joinedDays) {
  try {
    let roleName = '';
    let roleId = '';

    // Atribuie roluri pe baza numărului de zile
    if (joinedDays >= 2000) {
      roleName = '[2000+ ZILE]';
      roleId = '1329244056273813595';
    } else if (joinedDays >= 1000) {
      roleName = '[1000+ ZILE]';
      roleId = '844966132003635208';
    }// } else if (joinedDays >= 900) {
    //   roleName = '900 ZILE';
    //   roleId = 'ID_Rol_900';
    // } else if (joinedDays >= 700) {
    //   roleName = '700 ZILE';
    //   roleId = 'ID_Rol_700';
    // } else if (joinedDays >= 400) {
    //   roleName = '400 ZILE';
    //   roleId = 'ID_Rol_400';
    // } else if (joinedDays >= 200) {
    //   roleName = '200 ZILE';
    //   roleId = 'ID_Rol_200';
    // } else if (joinedDays >= 100) {
    //   roleName = '100 ZILE';
    //   roleId = 'ID_Rol_100';
    // } else if (joinedDays >= 50) {
    //   roleName = '50 ZILE';
    //   roleId = 'ID_Rol_50';
    // } else if (joinedDays >= 10) {
    //   roleName = '10 ZILE';
    //   roleId = 'ID_Rol_10';
    // }

    if (roleName && roleId) {
      const role = member.guild.roles.cache.get(roleId);
      if (role && !member.roles.cache.has(roleId)) {
        await member.roles.add(role);
        console.log(`Rolul "${roleName}" a fost atribuit lui ${member.user.tag}`);

        // Trimite un mesaj DM cu rolul acordat
        await sendRoleAssignedMessage(member, roleName);
      }
    }
  } catch (error) {
    console.log(`Nu am putut atribui rolul utilizatorului ${member.user.tag}: ${error.message}`);
  }
}

// Funcție pentru trimiterea unui mesaj DM utilizatorului atunci când un rol este atribuit
async function sendRoleAssignedMessage(member, roleName) {
  try {
    const embed = new EmbedBuilder()
      .setColor('#FFD700') // Culoarea rolului atribuit (auriu)
      .setTitle('🎉 Rol Atribuit! 🎉')
      .setDescription(`Ai primit rolul **${roleName}** pentru activitatea ta pe server! 🎉`)
      .setTimestamp()
      .setFooter({ text: 'Mulțumim pentru contribuția ta la comunitatea noastră!' });

    // Trimite mesajul embed în privat
    await member.send({ embeds: [embed] });
  } catch (error) {
    console.log(`Nu am putut trimite mesaj privat lui ${member.user.tag}: ${error.message}`);
  }
}
