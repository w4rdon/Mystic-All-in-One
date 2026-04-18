// --- ETKİLEŞİMLER (BİLET AÇMA BÖLÜMÜ) ---
client.on('interactionCreate', async (interaction) => {
    // ... diğer kodlar (puanlama vs) ...

    if (interaction.customId.startsWith('tk_')) {
        // İzinleri en baştan net bir şekilde tanımlıyoruz
        const permOverwrites = [
            {
                id: interaction.guild.id, 
                deny: [PermissionsBitField.Flags.ViewChannel] // Herkese kapat
            },
            {
                id: interaction.user.id, 
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] // Açan kişiye aç
            }
        ];

        // 3 Yetkili rolünün her birine tek tek tam yetki veriyoruz
        YETKILI_ROLLER.forEach(roleId => {
            permOverwrites.push({
                id: roleId,
                allow: [
                    PermissionsBitField.Flags.ViewChannel, 
                    PermissionsBitField.Flags.SendMessages, 
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.AttachFiles // Dosya (log) gönderebilmeleri için
                ]
            });
        });

        try {
            const biletKanal = await interaction.guild.channels.create({
                name: `${interaction.customId.replace('tk_', '')}-${interaction.user.username}`,
                type: ChannelType.GuildText,
                topic: interaction.user.id,
                permissionOverwrites: permOverwrites
            });

            await interaction.reply({ content: `Biletin başarıyla açıldı: ${biletKanal}`, ephemeral: true });
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('bilet_kapat').setLabel('🔒 Bileti Kapat').setStyle(ButtonStyle.Danger)
            );
            
            const yetkiliEtiket = YETKILI_ROLLER.map(id => `<@&${id}>`).join(' ');
            
            biletKanal.send({ 
                content: `Hoş geldin ${interaction.user},\n\n${yetkiliEtiket} ekibimiz en kısa sürede seninle ilgilenecektir.`,
                components: [row] 
            });
        } catch (error) {
            console.error("Kanal oluşturma hatası:", error);
            await interaction.reply({ content: "Bilet kanalı oluşturulurken bir hata oluştu. Lütfen botun 'Kanalları Yönet' yetkisi olduğundan emin olun.", ephemeral: true });
        }
    }
    // ... bilet kapatma ve çekiliş kodları ...
});
