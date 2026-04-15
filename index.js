const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers 
    ]
});

// --- KANAL ID AYARLARI ---
const LOG_KANAL_ID = "1436593740369236011"; 
const TICKET_KANAL_ID = "1436722668727697671"; 
const CEKILIS_KANAL_ID = "1436593740369236013"; 

let cekilisKatilimcilari = new Set();

client.once('ready', () => {
    console.log(`🚀 Mystic Bot Aktif: ${client.user.tag}`);
});

// --- KOMUTLAR ---
client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    if (message.content === '!kur') {
        const ticketChannel = client.channels.cache.get(TICKET_KANAL_ID);
        if (ticketChannel) {
            const ticketEmbed = new EmbedBuilder()
                .setTitle('Destek & Başvuru Merkezi')
                .setDescription('İşlem yapmak istediğiniz konuyu aşağıdaki butonlardan seçerek bilet açabilirsiniz.')
                .setColor(0x5865F2)
                .setFooter({ text: 'Mystic Destek Sistemi' });

            // İSTEDİĞİN BUTONLAR BURADA
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('tk_partner').setLabel('Partnerlik ⭐').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('tk_soru').setLabel('Pack Soruları 💖').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('tk_isbirliği').setLabel('İşbirliği 😈').setStyle(ButtonStyle.Secondary)
            );
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('tk_reklam').setLabel('Reklam 📺').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('tk_paylasim').setLabel('Pack Paylaşımı 👑').setStyle(ButtonStyle.Secondary)
            );

            await ticketChannel.send({ embeds: [ticketEmbed], components: [row1, row2] });
        }
        message.reply("✅ Yeni butonlu destek sistemi kuruldu!");
    }

    // Çekiliş Komutu
    if (message.content.startsWith('!çekiliş ')) {
        const odul = message.content.replace('!çekiliş ', '');
        const cekilisChannel = client.channels.cache.get(CEKILIS_KANAL_ID);
        if (cekilisChannel) {
            cekilisKatilimcilari.clear();
            const cekilisEmbed = new EmbedBuilder()
                .setTitle('🎉 ÇEKİLİŞ BAŞLADI! 🎉')
                .setDescription(`**Ödül:** ${odul}\n\nKatılmak için aşağıdaki butona tıkla!`)
                .setColor(0xFFA500);
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('cekilis_katil').setLabel('Katıl! 🥳').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('cekilis_bitir').setLabel('Bitir (Admin)').setStyle(ButtonStyle.Danger)
            );
            await cekilisChannel.send({ embeds: [cekilisEmbed], components: [row] });
        }
    }
});

// --- ETKİLEŞİMLER (BİLET AÇMA MANTIĞI) ---
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('tk_')) {
        let biletIsmi = "";
        let biletKonusu = "";

        if (interaction.customId === 'tk_partner') { biletIsmi = "partner"; biletKonusu = "Partnerlik"; }
        if (interaction.customId === 'tk_soru') { biletIsmi = "pack-soru"; biletKonusu = "Pack Hakkında Sorular"; }
        if (interaction.customId === 'tk_isbirliği') { biletIsmi = "isbirliği"; biletKonusu = "İşbirliği"; }
        if (interaction.customId === 'tk_reklam') { biletIsmi = "reklam"; biletKonusu = "Reklam"; }
        if (interaction.customId === 'tk_paylasim') { biletIsmi = "pack-paylasim"; biletKonusu = "Pack Paylaşımı"; }

        try {
            const biletKanal = await interaction.guild.channels.create({
                name: `${biletIsmi}-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                ]
            });

            await interaction.reply({ content: `Biletin açıldı: ${biletKanal}`, ephemeral: true });
            
            biletKanal.send(`Hoş geldin ${interaction.user},\n\n**Konu: ${biletKonusu}**\nEn kısa sürede yetkililer ilgilenecektir. ✨`);
        } catch (error) {
            console.error(error);
        }
    }

    // Çekiliş butonları
    if (interaction.customId === 'cekilis_katil') {
        if (cekilisKatilimcilari.has(interaction.user.id)) return interaction.reply({ content: 'Zaten katıldın!', ephemeral: true });
        cekilisKatilimcilari.add(interaction.user.id);
        await interaction.reply({ content: 'Çekilişe katıldın! 🍀', ephemeral: true });
    }

    if (interaction.customId === 'cekilis_bitir') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        const katilimcilar = Array.from(cekilisKatilimcilari);
        if (katilimcilar.length === 0) return interaction.reply({ content: 'Katılımcı yok!', ephemeral: true });
        const kazananId = katilimcilar[Math.floor(Math.random() * katilimcilar.length)];
        await interaction.update({ content: `🎉 Çekiliş bitti! Kazanan: <@${kazananId}>`, components: [], embeds: [] });
    }
});

client.login(process.env.DISCORD_TOKEN);
