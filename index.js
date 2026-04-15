const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers 
    ]
});

// --- SENİN SUNUCU AYARLARIN ---
const LOG_KANAL_ID = "1436593740369236011"; // Gelen-Giden kanalı
const TICKET_KANAL_ID = "1436722668727697671"; // Bilet sisteminin kurulacağı kanal
const CEKILIS_KANAL_ID = "1436593740369236013"; // Çekiliş duyuru kanalı

client.once('ready', () => {
    console.log(`🚀 Mystic Bot Aktif: ${client.user.tag}`);
});

// --- 1. GELEN - GİDEN SİSTEMİ ---
client.on('guildMemberAdd', async (member) => {
    const channel = member.guild.channels.cache.get(LOG_KANAL_ID);
    if (channel) {
        const welcomeEmbed = new EmbedBuilder()
            .setTitle('Mystic Dünyasına Hoş Geldin! 🎨')
            .setDescription(`Selam ${member}, seninle birlikte **${member.guild.memberCount}** kişi olduk!`)
            .setColor(0x00FF00)
            .setThumbnail(member.user.displayAvatarURL());
        channel.send({ embeds: [welcomeEmbed] });
    }
});

client.on('guildMemberRemove', async (member) => {
    const channel = member.guild.channels.cache.get(LOG_KANAL_ID);
    if (channel) {
        channel.send(`📤 **${member.user.tag}** aramızdan ayrıldı, görüşürüz!`);
    }
});

// --- 2. BİLET VE ÇEKİLİŞ KURULUM KOMUTU ---
client.on('messageCreate', async (message) => {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    if (message.content === '!kur') {
        
        // Bilet Mesajı
        const ticketChannel = client.channels.cache.get(TICKET_KANAL_ID);
        if (ticketChannel) {
            const ticketEmbed = new EmbedBuilder()
                .setTitle('Mystic Destek Sistemi')
                .setDescription('Yardım almak için aşağıdaki butona basarak bilet açabilirsin.')
                .setColor(0x5865F2);
            const btn = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('bilet_ac').setLabel('Bilet Aç').setStyle(ButtonStyle.Primary)
            );
            ticketChannel.send({ embeds: [ticketEmbed], components: [btn] });
        }

        // Çekiliş Duyurusu
        const cekilisChannel = client.channels.cache.get(CEKILIS_KANAL_ID);
        if (cekilisChannel) {
            cekilisChannel.send("🎉 **Mystic Çekiliş Sistemi Aktif!** Yakında burada dev çekilişler başlayacak.");
        }

        message.reply("✅ Sistemler ilgili kanallara kuruldu!");
    }
});

// --- 3. BİLET AÇMA İŞLEMİ ---
