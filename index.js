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
const LOG_KANAL_ID = "1436593740369236011"; 
const TICKET_KANAL_ID = "1436722668727697671"; 
const CEKILIS_KANAL_ID = "1436593740369236013"; 

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

// --- 2. KURULUM KOMUTU ---
client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    if (message.content === '!kur') {
        const ticketChannel = client.channels.cache.get(TICKET_KANAL_ID);
        if (ticketChannel) {
            const ticketEmbed = new EmbedBuilder()
                .setTitle('Mystic Destek Sistemi')
                .setDescription('Yardım almak için aşağıdaki butona basarak bilet açabilirsin.')
                .setColor(0x5865F2);
            const btn = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('bilet_ac').setLabel('Bilet Aç').setStyle(ButtonStyle.Primary)
            );
            await ticketChannel.send({ embeds: [ticketEmbed], components: [btn] });
        }

        const cekilisChannel = client.channels.cache.get(CEKILIS_KANAL_ID);
        if (cekilisChannel) {
            cekilisChannel.send("🎉 **Mystic Çekiliş Sistemi Aktif!** Yakında burada dev çekilişler başlayacak.");
        }

        message.reply("✅ Sistemler ilgili kanallara kuruldu!");
    }
});

// --- 3. BİLET AÇMA İŞLEMİ ---
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'bilet_ac') {
        try {
            const biletKanal = await interaction.guild.channels.create({
                name: `bilet-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                ]
            });

            await interaction.reply({ content: `Biletin açıldı: ${biletKanal}`, ephemeral: true });
            biletKanal.send(`Hoş geldin ${interaction.user}, yetkililer gelene kadar bekleyiniz.`);
        } catch (err) {
            console.error(err);
        }
    }
});

// --- BOTU GİRİŞ YAPTIR ---
client.login(process.env.DISCORD_TOKEN);
