const { Command } = require('../../../../utils')
const SelectionMenu = require('../../../../structures/interactions/SelectionMenu');
const Options = require('../../../../structures/interactions/Options');
const {ResponseAck} = require("../../../../utils");

module.exports = class ReportModConfigSubCommand extends Command {
    constructor() {
        super({
            name: 'config report',
            aliases: ['module', 'configurações', 'configurar'],
            permissions: [{
                entity: 'user',
                permissions: ['manageGuild']
            },
                {
                    entity: 'bot',
                    permissions: ['embedLinks']
                }]
        })
    }

    run(ctx) {
        const selectionMenu = new SelectionMenu()
            .maxValues(1)
            .minValues(1)
            .addItem(
                new Options()
                    .setLabel(ctx._locale('commands:config.config'))
                    .addDescription(ctx._locale('commands:config.configDescription'))
                    .setValue('set'),
                new Options()
                    .setLabel(ctx._locale('commands:config.disabled'))
                    .addDescription(ctx._locale('commands:config.disabledDescription'))
                    .setValue('disable')
            )
            .addPlaceHolder(ctx._locale('commands:config.chooseYourAction'))
            .setCustomID('config-select')
        ctx
            .interaction()
            .components(selectionMenu)
            .returnCtx()
            .send('Select option')
            .then(async (message) => {
                let interactionType = null
                const ack = new ResponseAck(message)
                ack.on('collect', ({ messageCollect, interaction }) => {
                    const components = []
                    const channels = []
                    if ((interactionType === null)) {
                        interactionType = interaction.values[0]
                        switch (interactionType) {
                            case 'set': {
                                ctx.message.guild.channels.forEach(value => {
                                    if (!(value.type === 2 || value.type == 13)) {
                                        if (!(value.type === 4)) {
                                            if (!(components.length > 24)) {
                                                components.push(
                                                    new Options()
                                                        .setLabel(value.name)
                                                        .addDescription(value.id)
                                                        .setValue(value.id)
                                                )
                                                channels.push(value)
                                            }
                                        }
                                    }
                                })
                                const selectionMenuUpdate = new SelectionMenu()
                                    .maxValues(1)
                                    .minValues(1)
                                    .addItem(components)
                                    .addPlaceHolder(ctx._locale('commands:language.selectChannel'))
                                    .setCustomID('channel-select')
                                ack.sendAck('update', {
                                    content: `Select the text channel.\n__Remembering if the desired channel does not appear, it means that Chino Kafuu does not have permission to view this channel! Check permissions!___`,
                                    components: [{type: 1, components: [selectionMenuUpdate]}]
                                })
                            }
                                break
                            case 'disable': {
                                ctx.db.guild.reportModule = false
                                ctx.db.guild.channelReport = ''
                                ctx.db.guild.save()

                                ack.sendAck('update', {
                                    content: `I'm disabling this module.`,
                                    components: []
                                })
                            }
                        }
                    } else {
                        // Select Page
                        const channel = ctx.message.guild.channels.get(interaction.values[0])
                        if ((channel == null)) {
                            channels.forEach((value) => {
                                channels.pop()
                            })
                            components.forEach((value) => {
                                components.pop()
                            })
                            interactionType = null;
                            ack.sendAck('update', {
                                content: `Oh no! It seems that this text channel no longer exists. Repeat the same actions.`,
                                components: [{type: 1, components: [selectionMenuUpdate]}]
                            })
                        } else {
                            ctx.db.guild.reportModule = true
                            ctx.db.guild.channelReport = channel.id
                            ctx.db.guild.save()

                            ack.sendAck('update', {
                                content: `Text channel set to **${channel.name} (<#${channel.id}>)**`,
                                components: []
                            })
                        }
                    }

                })
            })
    }
}