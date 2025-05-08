const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')

let botStatus = true
const BOT_PREFIX = '!'
const ongoingGames = {}
const groupSettings = {}

const commandMenu = `
╔══════════════════════════╗
       *Manu-IA - Commandes*
╚══════════════════════════╝

📌 *Basiques:*
${BOT_PREFIX}ping - Test du bot
${BOT_PREFIX}menu - Affiche ce menu
${BOT_PREFIX}info - Info du groupe

🎮 *Jeux:*
${BOT_PREFIX}game - Jeu de devinette
${BOT_PREFIX}pendu - Jeu du pendu
${BOT_PREFIX}quiz - Questions culture générale
${BOT_PREFIX}rps - Pierre, papier, ciseaux
${BOT_PREFIX}dé - Lance un dé

👥 *Groupe:*
${BOT_PREFIX}add @user - Ajouter un membre
${BOT_PREFIX}ban @user - Bannir un membre
${BOT_PREFIX}unban @user - Débannir
${BOT_PREFIX}mute @user - Muter
${BOT_PREFIX}unmute @user - Démuter
${BOT_PREFIX}link - Lien du groupe
${BOT_PREFIX}revoke - Révoquer le lien
${BOT_PREFIX}desc - Changer description
${BOT_PREFIX}name - Changer nom groupe

🛡️ *Admin:*
${BOT_PREFIX}promote - Promouvoir admin
${BOT_PREFIX}demote - Rétrograder admin
${BOT_PREFIX}kick - Expulser membre
${BOT_PREFIX}welcome - Message bienvenue
${BOT_PREFIX}goodbye - Message départ
${BOT_PREFIX}close - Fermer le groupe
${BOT_PREFIX}open - Ouvrir le groupe`

async function isAdmin(msg, client) {
    if (!msg.key.remoteJid.endsWith('@g.us')) return true
    try {
        const groupMetadata = await client.groupMetadata(msg.key.remoteJid)
        const participant = groupMetadata.participants.find(p => p.id === (msg.key.participant || msg.key.remoteJid))
        return participant?.admin
    } catch (error) {
        console.error('Erreur isAdmin:', error)
        return false
    }
}

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

    const client = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['Manu-IA', 'Chrome', '1.0.0'],
        pairingCode: true,
        pairingNumber: true 
    })

 
    if (!client.authState.creds.registered) {
        const phoneNumber = '242067274660'
        const code = await client.requestPairingCode(phoneNumber)
        console.log(`Code de pairage pour ${phoneNumber}: ${code}`)
    }

    client.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message || !botStatus) return

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
        const command = text.startsWith(BOT_PREFIX) ? text.slice(BOT_PREFIX.length).split(' ')[0].toLowerCase() : ''
        const args = text.split(' ').slice(1)
        const isGroup = msg.key.remoteJid.endsWith('@g.us')

        try {
            if (['menu', 'help', 'aide'].includes(command)) {
                await client.sendMessage(msg.key.remoteJid, { text: commandMenu })
            }
            else if (command === 'dé') {
                const result = Math.floor(Math.random() * 6) + 1
                await client.sendMessage(msg.key.remoteJid, { text: `🎲 Le dé montre: ${result}` })
            }
            else if (command === 'rps') {
                const choices = ['pierre', 'papier', 'ciseaux']
                const botChoice = choices[Math.floor(Math.random() * 3)]
                const userChoice = args[0]?.toLowerCase()

                if (!choices.includes(userChoice)) {
                    await client.sendMessage(msg.key.remoteJid, { text: '❌ Choix invalide! Utilisez: pierre, papier ou ciseaux' })
                    return
                }

                let result = "Égalité!"
                if (
                    (userChoice === 'pierre' && botChoice === 'ciseaux') ||
                    (userChoice === 'papier' && botChoice === 'pierre') ||
                    (userChoice === 'ciseaux' && botChoice === 'papier')
                ) {
                    result = "Vous gagnez! 🎉"
                } else if (userChoice !== botChoice) {
                    result = "Je gagne! 😎"
                }

                await client.sendMessage(msg.key.remoteJid, { 
                    text: `Vous: ${userChoice}\nMoi: ${botChoice}\n${result}` 
                })
            }
            else if (isGroup && await isAdmin(msg, client)) {
                if (command === 'add' && args[0]) {
                    const users = args.map(user => user.replace('@', '') + '@s.whatsapp.net')
                    await client.groupParticipantsUpdate(msg.key.remoteJid, users, 'add')
                    await client.sendMessage(msg.key.remoteJid, { text: '✅ Membre(s) ajouté(s)' })
                }
                else if (command === 'ban' && args[0]) {
                    const users = args.map(user => user.replace('@', '') + '@s.whatsapp.net')
                    await client.groupParticipantsUpdate(msg.key.remoteJid, users, 'remove')
                    groupSettings[msg.key.remoteJid] = groupSettings[msg.key.remoteJid] || { banned: [] }
                    groupSettings[msg.key.remoteJid].banned.push(...users)
                    await client.sendMessage(msg.key.remoteJid, { text: '🚫 Membre(s) banni(s)' })
                }
                else if (command === 'mute' && args[0]) {
                    groupSettings[msg.key.remoteJid] = groupSettings[msg.key.remoteJid] || { muted: [] }
                    const users = args.map(user => user.replace('@', '') + '@s.whatsapp.net')
                    groupSettings[msg.key.remoteJid].muted.push(...users)
                    await client.sendMessage(msg.key.remoteJid, { text: '🤐 Membre(s) muté(s)' })
                }
                else if (command === 'unmute' && args[0]) {
                    if (groupSettings[msg.key.remoteJid]?.muted) {
                        const users = args.map(user => user.replace('@', '') + '@s.whatsapp.net')
                        groupSettings[msg.key.remoteJid].muted = groupSettings[msg.key.remoteJid].muted
                            .filter(id => !users.includes(id))
                        await client.sendMessage(msg.key.remoteJid, { text: '🗣️ Membre(s) démuté(s)' })
                    }
                }
                else if (command === 'link') {
                    const code = await client.groupInviteCode(msg.key.remoteJid)
                    await client.sendMessage(msg.key.remoteJid, { 
                        text: `🔗 Lien du groupe:\nhttps://chat.whatsapp.com/${code}` 
                    })
                }
                else if (command === 'revoke') {
                    await client.groupRevokeInvite(msg.key.remoteJid)
                    await client.sendMessage(msg.key.remoteJid, { text: '🔄 Lien du groupe révoqué' })
                }
                else if (command === 'desc' && args.length > 0) {
                    await client.groupUpdateDescription(msg.key.remoteJid, args.join(' '))
                    await client.sendMessage(msg.key.remoteJid, { text: '✏️ Description mise à jour' })
                }
                else if (command === 'name' && args.length > 0) {
                    await client.groupUpdateSubject(msg.key.remoteJid, args.join(' '))
                    await client.sendMessage(msg.key.remoteJid, { text: '✏️ Nom du groupe mis à jour' })
                }
            }

        } catch (error) {
            console.error('Erreur:', error)
            await client.sendMessage(msg.key.remoteJid, { text: "❌ Une erreur est survenue" })
        }
    })

    client.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('Connexion fermée:', lastDisconnect.error)
            if(shouldReconnect) {
                connectToWhatsApp()
            }
        } else if(connection === 'open') {
            console.log('✅ Bot connecté!')
        }
    })

    client.ev.on('creds.update', saveCreds)
}

connectToWhatsApp()