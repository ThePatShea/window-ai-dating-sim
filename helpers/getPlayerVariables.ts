import { Message } from './interfaces';

function getPlayerVariables(activeMessages: Message[]) {
    const latestPlayerVariablesMessage: Message | undefined = activeMessages.slice().reverse().find((message) => message.content.indexOf('[Stats]') > -1);

    const pVarsContent: string = latestPlayerVariablesMessage?.content || '';
    
    let statsMessage: string = pVarsContent.substring(pVarsContent.indexOf('[Stats]') + 7, pVarsContent.length);
    statsMessage = statsMessage.substring(0, statsMessage.indexOf('[Stats]'));
    
    const playerVariables = {
      day: parseInt(statsMessage.substring(statsMessage.indexOf('Day:') + 5, statsMessage.indexOf('| HP')).trim()) || 0,
      hp: parseInt(statsMessage.substring(statsMessage.indexOf('HP:') + 3, statsMessage.indexOf('| Money')).trim()) || 100,
      money: statsMessage.substring(statsMessage.indexOf('Money:') + 6, statsMessage.indexOf('| Strength')).trim() || '$100',
      strength: parseInt(statsMessage.substring(statsMessage.indexOf('Strength:') + 10, statsMessage.indexOf('| Intelligence')).trim()) || 10,
      intelligence: parseInt(statsMessage.substring(statsMessage.indexOf('Intelligence:') + 14, statsMessage.length).trim()) || 10,
    }

    return playerVariables;
}

export default getPlayerVariables;