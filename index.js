const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, AttachmentBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

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

            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('tk_partner').setLabel('Partnerlik ⭐').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('tk_soru').setLabel('Pack Hakkında Sorular 💖').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('tk_isbirligi').setLabel('İşbirliği 😈').setStyle(ButtonStyle.Secondary)
            );
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('tk_reklam').setLabel('Reklam 📺').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('tk_paylasim').setLabel('Pack Paylaşımı 👑').setStyle(ButtonStyle.Secondary)
            );

            await ticketChannel.send({ embeds: [ticketEmbed], components: [row1, row2] });
        }
        message.reply("✅ Gelişmiş Loglu bilet sistemi kuruldu!");
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

// --- ETKİLEŞİMLER ---
client.on('interactionCreate', async (interaction) => {

    // 1. PUANLAMA MENÜSÜ CEVABI (Menü seçimi olduğunda çalışır)
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_puan') {
        const puan = interaction.values[0];
        await interaction.update({ 
            content: `🌟 Destek hizmetimizi **${puan}/10** olarak değerlendirdiğiniz için teşekkür ederiz!`, 
            components: [] 
        });
        return;
    }

    if (!interaction.isButton()) return;

    // 2. BİLET AÇMA
    if (interaction.customId.startsWith('tk_')) {
        let biletIsmi = "";
        let biletKonusu = "";

        if (interaction.customId === 'tk_partner') { biletIsmi = "partner"; biletKonusu = "Partnerlik"; }
        if (interaction.customId === 'tk_soru') { biletIsmi = "pack-soru"; biletKonusu = "Pack Hakkında Sorular"; }
        if (interaction.customId === 'tk_isbirligi') { biletIsmi = "isbirligi"; biletKonusu = "İşbirliği"; }
        if (interaction.customId === 'tk_reklam') { biletIsmi = "reklam"; biletKonusu = "Reklam"; }
        if (interaction.customId === 'tk_paylasim') { biletIsmi = "pack-paylasim"; biletKonusu = "Pack Paylaşımı"; }

        try {
            const biletKanal = await interaction.guild.channels.create({
                name: `${biletIsmi}-${interaction.user.username}`,
                type: ChannelType.GuildText,
                topic: interaction.user.id, // BİLETİ AÇANIN ID'SİNİ BURAYA KAYDEDİYORUZ (DM İÇİN LAZIM)
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                ]
            });

            await interaction.reply({ content: `Biletin açıldı: ${biletKanal}`, ephemeral: true });
            
            const kapatButonu = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('bilet_kapat').setLabel('🔒 Bileti Kapat').setStyle(ButtonStyle.Danger)
            );

            biletKanal.send({ 
                content: `Hoş geldin ${interaction.user},\n\n**Konu: ${biletKonusu}**\nEn kısa sürede yetkililer ilgilenecektir. ✨`,
                components: [kapatButonu]
            });
        } catch (error) {
            console.error(error);
        }
    }

    // 3. BİLETİ KAPATMA, LOG ALMA VE DM ATMA
    if (interaction.customId === 'bilet_kapat') {
        await interaction.reply({ content: '🔒 Bilet kapatılıyor, loglar hazırlanıp DM üzerinden iletilecek...' });
        
        const channel = interaction.channel;
        const ticketOwnerId = channel.topic; // Açarken kaydettiğimiz ID

        try {
            // Mesajları çek ve TXT dosyası yap
            const messages = await channel.messages.fetch({ limit: 100 });
            const logText = messages.reverse().map(m => `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}`).join('\n');
            const attachment = new AttachmentBuilder(Buffer.from(logText, 'utf-8'), { name: `${channel.name}-log.txt` });

            // 1'den 10'a kadar puanlama menüsü oluştur
            const puanMenu = new StringSelectMenuBuilder()
                .setCustomId('ticket_puan')
                .setPlaceholder('Hizmetimizi 10 üzerinden değerlendirin')
                .addOptions(
                    Array.from({ length: 10 }, (_, i) => 
                        new StringSelectMenuOptionBuilder().setLabel(`${i + 1} Puan`).setValue(`${i + 1}`)
                    )
                );
            const menuRow = new ActionRowBuilder().addComponents(puanMenu);

            // Bileti açan kişiyi bul ve DM at
            if (ticketOwnerId) {
                const owner = await client.users.fetch(ticketOwnerId).catch(() => null);
                if (owner) {
                    await owner.send({
                        content: `Merhaba! **${interaction.guild.name}** sunucusundaki destek biletiniz kapatıldı. Görüşmelerin kaydı ektedir.\n\nLütfen aldığınız desteği 10 üzerinden değerlendirin:`,
                        files: [attachment],
                        components: [menuRow]
                    }).catch(() => console.log("Kullanıcının DM'i kapalı, mesaj iletilemedi."));
                }
            }
        } catch (err) {
            console.error("Log kaydetme hatası:", err);
        }

        // Mesajları attıktan 5 saniye sonra kanalı sil
        setTimeout(() => {
            channel.delete().catch(console.error);
        }, 5000);
    }

    // 4. ÇEKİLİŞ BUTONLARI
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
