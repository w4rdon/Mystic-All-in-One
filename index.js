const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, AttachmentBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// --- AYARLAR ---
const LOG_KANAL_ID = "1436593740369236011"; 
const TICKET_KANAL_ID = "1436722668727697671"; 
const CEKILIS_KANAL_ID = "1436593740369236013"; 

let cekilisData = {
    katilimcilar: new Set(),
    odul: "",
    bitisZamani: null,
    mesajId: null
};

client.once('ready', () => {
    console.log(`🚀 Mystic Bot Aktif: ${client.user.tag}`);
});

// --- GELEN - GİDEN SİSTEMİ (DÜZELTİLDİ) ---
client.on('guildMemberAdd', async (member) => {
    const kanal = member.guild.channels.cache.get(LOG_KANAL_ID);
    if (!kanal) return;
    const embed = new EmbedBuilder()
        .setTitle('Hoş Geldin! ✨')
        .setDescription(`Selam ${member}, aramıza hoş geldin! Seninle birlikte **${member.guild.memberCount}** kişi olduk.`)
        .setThumbnail(member.user.displayAvatarURL())
        .setColor(0x00FF00);
    kanal.send({ embeds: [embed] }).catch(console.error);
});

client.on('guildMemberRemove', async (member) => {
    const kanal = member.guild.channels.cache.get(LOG_KANAL_ID);
    if (!kanal) return;
    kanal.send(`📤 **${member.user.tag}** sunucudan ayrıldı. Görüşürüz!`).catch(console.error);
});

// --- KOMUTLAR ---
client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;

    // !kur komutu (Ticket Arayüzü)
    if (message.content === '!kur' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const ticketChannel = client.channels.cache.get(TICKET_KANAL_ID);
        if (ticketChannel) {
            const ticketEmbed = new EmbedBuilder()
                .setTitle('Destek & Başvuru Merkezi')
                .setDescription('İşlem yapmak istediğiniz konuyu aşağıdaki butonlardan seçerek bilet açabilirsiniz.')
                .setColor(0x5865F2);

            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('tk_partner').setLabel('Partnerlik ⭐').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('tk_soru').setLabel('Pack Soruları 💖').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('tk_isbirligi').setLabel('İşbirliği 😈').setStyle(ButtonStyle.Secondary)
            );
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('tk_reklam').setLabel('Reklam 📺').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('tk_paylasim').setLabel('Pack Paylaşımı 👑').setStyle(ButtonStyle.Secondary)
            );

            await ticketChannel.send({ embeds: [ticketEmbed], components: [row1, row2] });
            message.reply("✅ Sistemler başarıyla kuruldu!");
        }
    }

    // !çekiliş [Süre] [Ödül] -> Örnek: !çekiliş 1 Nitro
    if (message.content.startsWith('!çekiliş ') && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const args = message.content.split(' ');
        const gun = parseInt(args[1]);
        const odul = args.slice(2).join(' ');

        if (!gun || !odul) return message.reply("Lütfen doğru formatta yaz: `!çekiliş [Gün Sayısı] [Ödül]` (Örnek: `!çekiliş 3 Nitro`) ");

        const bitis = new Date();
        bitis.setDate(bitis.getDate() + gun);
        
        cekilisData.katilimcilar.clear();
        cekilisData.odul = odul;
        cekilisData.bitisZamani = bitis;

        const cekilisEmbed = new EmbedBuilder()
            .setTitle('🎉 ÇEKİLİŞ BAŞLADI 🎉')
            .setDescription(`**Ödül:** ${odul}\n**Süre:** ${gun} Gün\n**Bitiş:** <t:${Math.floor(bitis.getTime() / 1000)}:R>\n\n**Katılımcı Sayısı:** 0`)
            .setColor(0xFFA500)
            .setFooter({ text: 'Katılmak için aşağıdaki butona basın!' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('cekilis_katil').setLabel('Katıl! 🥳').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('cekilis_bitir').setLabel('Bitir (Admin)').setStyle(ButtonStyle.Danger)
        );

        const kanal = client.channels.cache.get(CEKILIS_KANAL_ID);
        const msg = await kanal.send({ embeds: [cekilisEmbed], components: [row] });
        cekilisData.mesajId = msg.id;
        message.reply(`✅ ${gun} günlük çekiliş başlatıldı!`);
    }
});

// --- ETKİLEŞİMLER ---
client.on('interactionCreate', async (interaction) => {
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_puan') {
        return interaction.update({ content: `🌟 Değerlendirdiğin için teşekkürler: **${interaction.values[0]}/10**`, components: [] });
    }

    if (!interaction.isButton()) return;

    // Bilet Açma
    if (interaction.customId.startsWith('tk_')) {
        const biletKanal = await interaction.guild.channels.create({
            name: `${interaction.customId.replace('tk_', '')}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            topic: interaction.user.id,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
            ]
        });
        await interaction.reply({ content: `Bilet açıldı: ${biletKanal}`, ephemeral: true });
        
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('bilet_kapat').setLabel('🔒 Bileti Kapat').setStyle(ButtonStyle.Danger));
        biletKanal.send({ content: `Hoş geldin ${interaction.user}, en kısa sürede yetkililer ilgilenecektir.`, components: [row] });
    }

    // Bilet Kapatma (Loglu & DM)
    if (interaction.customId === 'bilet_kapat') {
        await interaction.reply({ content: '🔒 Bilet kapatılıyor, loglar DM atılıyor...' });
        try {
            const msgs = await interaction.channel.messages.fetch({ limit: 100 });
            const logText = msgs.reverse().map(m => `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}`).join('\n');
            const file = new AttachmentBuilder(Buffer.from(logText, 'utf-8'), { name: 'log.txt' });
            
            const owner = await client.users.fetch(interaction.channel.topic).catch(() => null);
            if (owner) {
                const puanMenu = new StringSelectMenuBuilder().setCustomId('ticket_puan').setPlaceholder('Hizmetimizi puanlayın')
                    .addOptions(Array.from({ length: 10 }, (_, i) => new StringSelectMenuOptionBuilder().setLabel(`${i + 1} Puan`).setValue(`${i + 1}`)));
                await owner.send({ content: `Biletiniz kapatıldı. Lütfen puan verin:`, files: [file], components: [new ActionRowBuilder().addComponents(puanMenu)] }).catch(() => {});
            }
        } catch (e) {}
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }

    // Çekiliş Katılım
    if (interaction.customId === 'cekilis_katil') {
        if (cekilisData.katilimcilar.has(interaction.user.id)) return interaction.reply({ content: 'Zaten katıldın!', ephemeral: true });
        
        cekilisData.katilimcilar.add(interaction.user.id);
        
        // Embed Güncelleme (Katılımcı sayısını canlı değiştirir)
        const currentEmbed = interaction.message.embeds[0];
        const newEmbed = EmbedBuilder.from(currentEmbed)
            .setDescription(`**Ödül:** ${cekilisData.odul}\n**Bitiş:** <t:${Math.floor(cekilisData.bitisZamani.getTime() / 1000)}:R>\n\n**Katılımcı Sayısı:** ${cekilisData.katilimcilar.size}`);
        
        await interaction.update({ embeds: [newEmbed] });
    }

    // Çekiliş Bitirme
    if (interaction.customId === 'cekilis_bitir') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        const liste = Array.from(cekilisData.katilimcilar);
        if (liste.length === 0) return interaction.reply({ content: 'Kimse katılmadığı için kazanan seçilemedi.', ephemeral: true });
        
        const kazanan = liste[Math.floor(Math.random() * liste.length)];
        await interaction.update({ content: `🎊 Çekiliş sona erdi! Kazanan: <@${kazanan}>`, components: [], embeds: [] });
        await interaction.channel.send(`🎊 Tebrikler <@${kazanan}>! **${cekilisData.odul}** kazandın!`);
    }
});

client.login(process.env.DISCORD_TOKEN);
