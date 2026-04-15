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

            // 5 ADET SEÇENEK BUTONU
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
        message.reply("✅ Yeni butonlu destek sistemi ve bilet kapatma özelliği kuruldu!");
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

// --- ETKİLEŞİMLER (B
