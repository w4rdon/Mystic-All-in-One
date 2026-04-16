const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, AttachmentBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Collection } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites // Davetleri takip etmek için şart
    ]
});

// --- AYARLAR ---
const LOG_KANAL_ID = "1436593740369236011"; 
const TICKET_KANAL_ID = "1436722668727697671"; 
const CEKILIS_KANAL_ID = "1436593740369236013"; 

const invites = new Collection(); // Davetleri tutacağımız yer
let cekilisData = { katilimcilar: new Set(), odul: "", bitisZamani: null, mesajId: null };

// --- DAVETLERİ HAFIZAYA ALMA ---
client.once('ready', async () => {
    console.log(`🚀 Mystic Bot Aktif: ${client.user.tag}`);
    
    // Bot açıldığında tüm sunuculardaki davetleri tara
    client.guilds.cache.forEach(async (guild) => {
        const firstInvites = await guild.invites.fetch().catch(() => new Collection());
        invites.set(guild.id, new Collection(firstInvites.map((inv) => [inv.code, inv.uses])));
    });
});

// Yeni bir davet linki oluşturulduğunda listeye ekle
client.on('inviteCreate', (invite) => {
    const guildInvites = invites.get(invite.guild.id);
    guildInvites.set(invite.code, invite.uses);
});

// --- GELEN - GİDEN SİSTEMİ (INVITE SAYAÇLI) ---
client.on('guildMemberAdd', async (member) => {
    const kanal = member.guild.channels.cache.get(LOG_KANAL_ID);
    if (!kanal) return;

    // Davetleri karşılaştır
    const newInvites = await member.guild.invites.fetch().catch(() => new Collection());
    const oldInvites = invites.get(member.guild.id);
    const invite = newInvites.find((i) => i.uses > (oldInvites.get(i.code) || 0));
    
    // Hafızayı güncelle
    invites.set(member.guild.id, new Collection(newInvites.map((inv) => [inv.code, inv.uses])));

    let inviterText = "Bilinmiyor (Veya özel link)";
    if (invite) {
        inviterText = `${invite.inviter.tag} (**${invite.uses}** davet)`;
    }

    const embed = new EmbedBuilder()
        .setTitle('Hoş Geldin! ✨')
        .setDescription(`Selam ${member}, aramıza hoş geldin!\n\n👤 **Davet Eden:** ${inviterText}\n🔢 **Üye Sayısı:** ${member.guild.memberCount}\n\n🎉 <#1436593740369236013> kanalındaki çekilişlere katılmayı unutma!`)
        .setThumbnail(member.user.displayAvatarURL())
        .setColor(0x00FF00)
        .setFooter({ text: 'Mystic Invite Sistemi' });

    kanal.send({ embeds: [embed] }).catch(console.error);
});

client.on('guildMemberRemove', async (member) => {
    const kanal = member.guild.channels.cache.get(LOG_KANAL_ID);
    if (!kanal) return;
    kanal.send(`📤 **${member.user.tag}** sunucudan ayrıldı. Görüşürüz!`).catch(console.error);
});

// --- DİĞER KOMUTLAR (TICKET & ÇEKİLİŞ) ---
client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    if (message.content === '!kur') {
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
            message.reply("✅ Sistemler kuruldu!");
        }
    }

    if (message.content.startsWith('!çekiliş ')) {
        const args = message.content.split(' ');
        const gun = parseInt(args[1]);
        const odul = args.slice(2).join(' ');
        if (!gun || !odul) return message.reply("Format: `!çekiliş [Gün] [Ödül]`");

        const bitis = new Date();
        bitis.setDate(bitis.getDate() + gun);
        cekilisData = { katilimcilar: new Set(), odul: odul, bitisZamani: bitis };

        const cekilisEmbed = new EmbedBuilder()
            .setTitle('🎉 ÇEKİLİŞ BAŞLADI 🎉')
            .setDescription(`**Ödül:** ${odul}\n**Bitiş:** <t:${Math.floor(bitis.getTime() / 1000)}:R>\n\n**Katılımcı Sayısı:** 0`)
            .setColor(0xFFA500);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('cekilis_katil').setLabel('Katıl! 🥳').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('cekilis_bitir').setLabel('Bitir (Admin)').setStyle(ButtonStyle.Danger)
        );

        const kanal = client.channels.cache.get(CEKILIS_KANAL_ID);
        await kanal.send({ embeds: [cekilisEmbed], components: [row] });
    }
});

// --- ETKİLEŞİMLER (BİLET & PUANLAMA & ÇEKİLİŞ KATILIM) ---
client.on('interactionCreate', async (interaction) => {
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_puan') {
        return interaction.update({ content: `🌟 Değerlendirme için teşekkürler: **${interaction.values[0]}/10**`, components: [] });
    }
    if (!interaction.isButton()) return;

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
        biletKanal.send({ content: `Hoş geldin ${interaction.user}, en kısa sürede ilgilenilecektir.`, components: [row] });
    }

    if (interaction.customId === 'bilet_kapat') {
        await interaction.reply({ content: '🔒 Bilet kapatılıyor...' });
        try {
            const msgs = await interaction.channel.messages.fetch({ limit: 100 });
            const logText = msgs.reverse().map(m => `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}`).join('\n');
            const file = new AttachmentBuilder(Buffer.from(logText, 'utf-8'), { name: 'log.txt' });
            const owner = await client.users.fetch(interaction.channel.topic).catch(() => null);
            if (owner) {
                const puanMenu = new StringSelectMenuBuilder().setCustomId('ticket_puan').setPlaceholder('Hizmetimizi puanlayın')
                    .addOptions(Array.from({ length: 10 }, (_, i) => new StringSelectMenuOptionBuilder().setLabel(`${i + 1} Puan`).setValue(`${i + 1}`)));
                await owner.send({ content: `Biletiniz kapatıldı. Loglar ektedir:`, files: [file], components: [new ActionRowBuilder().addComponents(puanMenu)] }).catch(() => {});
            }
        } catch (e) {}
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }

    if (interaction.customId === 'cekilis_katil') {
        if (cekilisData.katilimcilar.has(interaction.user.id)) return interaction.reply({ content: 'Zaten katıldın!', ephemeral: true });
        cekilisData.katilimcilar.add(interaction.user.id);
        const currentEmbed = interaction.message.embeds[0];
        const newEmbed = EmbedBuilder.from(currentEmbed).setDescription(`**Ödül:** ${cekilisData.odul}\n**Bitiş:** <t:${Math.floor(cekilisData.bitisZamani.getTime() / 1000)}:R>\n\n**Katılımcı Sayısı:** ${cekilisData.katilimcilar.size}`);
        await interaction.update({ embeds: [newEmbed] });
    }

    if (interaction.customId === 'cekilis_bitir') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        const liste = Array.from(cekilisData.katilimcilar);
        if (liste.length === 0) return interaction.reply({ content: 'Katılımcı yok!', ephemeral: true });
        const kazanan = liste[Math.floor(Math.random() * liste.length)];
        await interaction.update({ content: `🎊 Kazanan: <@${kazanan}>`, components: [], embeds: [] });
    }
});

client.login(process.env.DISCORD_TOKEN);
