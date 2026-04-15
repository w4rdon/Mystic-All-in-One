const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers 
    ]
});

// --- KANAL ID AYARLARIN ---
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

    // !kur komutu mesajı güncellendi
    if (message.content === '!kur') {
        const ticketChannel = client.channels.cache.get(TICKET_KANAL_ID);
        if (ticketChannel) {
            const ticketEmbed = new EmbedBuilder()
                .setTitle('Valyria Destek & Başvuru Merkezi')
                .setDescription('**Partnerlik**, **pack sorma** veya **pack ekletmek** için aşağıdan bilet açabilirsiniz.')
                .addFields(
                    { name: '🤝 Partnerlik', value: 'Şartlar ve başvuru için.', inline: true },
                    { name: '📦 Pack İşlemleri', value: 'Soru ve ekletme talepleri için.', inline: true }
                )
                .setColor(0x5865F2)
                .setFooter({ text: 'Mystic Ticket Sistemi' });

            const btn = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('bilet_ac').setLabel('Bilet Aç 📩').setStyle(ButtonStyle.Primary)
            );
            await ticketChannel.send({ embeds: [ticketEmbed], components: [btn] });
        }
        message.reply("✅ Destek arayüzü yeni haliyle kuruldu!");
    }

    // Çekiliş komutu
    if (message.content.startsWith('!çekiliş ')) {
        const odul = message.content.replace('!çekiliş ', '');
        const cekilisChannel = client.channels.cache.get(CEKILIS_KANAL_ID);
        if (cekilisChannel) {
            cekilisKatilimcilari.clear();
            const cekilisEmbed = new EmbedBuilder()
                .setTitle('🎉 DEV ÇEKİLİŞ BAŞLADI! 🎉')
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

// --- BUTON ETKİLEŞİMLERİ ---
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // BİLET AÇMA (İstediğin düzeltmeler burada)
    if (interaction.customId === 'bilet_ac') {
        try {
            const biletKanal = await interaction.guild.channels.create({
                name: `destek-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                ]
            });

            await interaction.reply({ content: `Biletin açıldı: ${biletKanal}`, ephemeral: true });
            
            // Buradaki mesajı senin istediğin gibi güncelledim:
            biletKanal.send(`Hoş geldin ${interaction.user},\n\n**Partnerlik, pack işlemleri veya diğer soruların için en kısa sürede yetkililer ilgilenecektir.** ✨`);
        } catch (error) {
            console.error(error);
        }
    }

    // Çekiliş Katılım
    if (interaction.customId === 'cekilis_katil') {
        if (cekilisKatilimcilari.has(interaction.user.id)) return interaction.reply({ content: 'Zaten katıldın!', ephemeral: true });
        cekilisKatilimcilari.add(interaction.user.id);
        await interaction.reply({ content: 'Çekilişe katıldın! 🍀', ephemeral: true });
    }

    // Çekiliş Bitirme
    if (interaction.customId === 'cekilis_bitir') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        const katilimcilar = Array.from(cekilisKatilimcilari);
        if (katilimcilar.length === 0) return interaction.reply({ content: 'Katılımcı yok!', ephemeral: true });
        const kazananId = katilimcilar[Math.floor(Math.random() * katilimcilar.length)];
        await interaction.update({ content: `🎉 Çekiliş bitti! Kazanan: <@${kazananId}>`, components: [], embeds: [] });
        await interaction.channel.send(`🎊 Tebrikler <@${kazananId}>! Çekilişi kazandın.`);
    }
});

client.login(process.env.DISCORD_TOKEN);
