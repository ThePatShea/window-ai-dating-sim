import React, { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('Start Game');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const aiRef = useRef<any>(null);

  useEffect(() => {
    const waitForAI = async () => {
      let timeoutCounter = 0;
      while (!(window as any).ai) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        timeoutCounter += 100;
        if (timeoutCounter >= 1000) {
          toast.custom(
            <div className="bg-blue-500 text-white p-4 rounded-lg shadow-md flex items-center space-x-2">
              <div>Please visit</div>
              <Link
                href="https://windowai.io"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold"
              >
                windowai.io
              </Link>
              <div>to install window.ai</div>
            </div>, {
              id: 'window-ai-not-detected',
            }
          );
          break;
        }
      }
      if((window as any).ai){
        aiRef.current = (window as any).ai;
        toast.success('window.ai detected!', {
          id: 'window-ai-detected',
        });
      }
      
    };
    waitForAI();
  }, []);

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputValue) return;

    const newMessage: Message = { role: 'user', content: inputValue };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputValue('');

    setLoading(true);

    let updatedMessages = [...messages, newMessage];

    const streamingOptions = {
      temperature: 1,
      maxTokens: 1000,
      onStreamResult: (result?: { message: Message }, error?: Error) => {
        if (error) {
          toast.error('window.ai streaming completion failed.');
          setLoading(false);
        } else if (result) {
          setLoading(false);

          const lastMessage = updatedMessages[updatedMessages.length - 1];
          if (lastMessage.role === 'user') {
            setLoading(false);
            updatedMessages = [
              ...updatedMessages,
              {
                role: 'assistant',
                content: result.message.content,
              },
            ];
          } else {
            updatedMessages = updatedMessages.map((message, index) => {
              if (index === updatedMessages.length - 1) {
                return {
                  ...message,
                  content: message.content + result.message.content,
                };
              }
              return message;
            });
          }

          setMessages(updatedMessages);
        }
      },
    };

    if (aiRef.current) {
      try {
        await aiRef.current.getCompletion(
          { messages: [{ role: 'system', content: `You are a dating simulation video game called DateCity.

          You will create a background and a world for the game.
          
          The game takes place in a city that contains a bar, a university, a restaurant, a gym, a mall, and a house. The player of the game lives in the house.
          
          The player can go to the bar and talk to women. The goal of the game is for the player to get a woman to come home with him. Every woman starts out with an attraction score of 0, which indicates how attracted she is to the player. Positive interactions increase the woman's attraction score. Negative interactions decrease the woman's attraction score. The minimum attraction score is -100. The maximum attraction score is 100. As a woman's attraction score increases, she becomes closer with the player, unlocking more things they can do together. If her attraction score reaches 100, she will agree to come home with the player if he invites her to come home with him. When the player takes her home with him, he wins the game.
          
          For each woman the player talks to, the player gets to write something custom to say to her. Then, you'll figure out how many points that response will add or subtract from her attraction score. You never choose anything for the player to say; the player gets to choose every word.
          
          Every time a woman responds to something the player said, you will report how many points got added to or subtracted from her attraction score, and report her new attraction score.
          
          The player also has an amount of money that starts at $100. He needs to pay a fee every time he enters the bar. He can also buy women drinks at the bar, and buy them gifts at the mall, which each cost money.
          
          The player has two stat points: knowledge and strength. They both start at 10 and can increase up to 100.
          
          The player can make money by working at the restaurant. At the restaurant, he must persuade customers to buy expensive items on the menu and give them good service so that they leave a good tip. Don't summarize what happens at the restaurant. The player needs to have conversations with the customers in the same way he has conversations with women at the bar. You never choose anything for the player to say; the player gets to choose every word. A higher knowledge stat allows the player to make more money at the restaurant. When the player's knowledge stat is at 10, it is IMPOSSIBLE to convince the customers at the restaurant to buy anything other than the cheapest item on the menu. As the player's knowledge stat increases, it becomes progressively easier for him to convince the customers at the restaurant to buy more expensive items. When his knowledge stat reaches 100, he can convince the customers at the restaurant to buy anything.
          
          The player can take classes at the university to level up his knowledge stat. At the university, the player must take multiple-choice tests. A multiple choice test has 5 questions. The player is graded with an F, D, C, B, or A, based on how many questions he answers correctly. A grade of F or D decreases the player's knowledge stat. A grade of C keeps his knowledge stat the same. A grade of B or A increases his knowledge stat. Do not summarize the tests and the player's answers; deliver the entire test to the player, one question at a time, and require the player to answer.
          
          The player can workout at the gym to level up his strength stat. Make the mechanics for working out fun, challenging, and engaging. The player's strength stat should increase or decrease based on how well he did at the workout. Don't summarize what happens at the gym; require the player to take some action. Make it fun.
          
          A higher strength stat makes the player more attractive to the women at the bar, making it easier for women to increase their attraction score toward him at the bar. When the player's strength score is 10, it is IMPOSSIBLE to increase a woman's attraction score toward him at the bar. It gets progressively easier as his strength increases.
          
          The player must pay a fee every time he enters the gym and every time he enters the university.
          
          The player also has an HP meter that starts at 100. Every action the player does decreases his HP. If he has less HP than the action costs, he can't do the action. When his HP reaches 0, the only action he can take is to go home and go to sleep. When he goes to sleep, his HP returns to 100.
          
          The game also has a day counter that starts at 0. Every time the player goes to sleep, the day counter increases by 1. If the day counter reaches 100 and the player hasn't taken a woman home, he loses the game.
          
          The game also exists in an infinitely-large world where the player can do anything. If he says wants to go somewhere or do something that isn't listed above, allow him to do it, and make it relevant to the game somehow.
          
          Start the game like this: Welcome the player to DateCity. Explain how the game works. Next, tell the player his current stats, his current HP, his current money and the current day. Then, tell him his options for where he can go. After that, ask him where he wants to go first.

          Let's play.` }, ...messages, newMessage] },
          streamingOptions
        );
      } catch (e) {
        setLoading(false);
        //comment this if not using window.ai onStreamResult - otherwise redudant
        //toast.error('Window.ai completion failed.');
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <img src="/datecity-bg.jpg" alt="DateCity Background" className="fixed z-0 blur-sm"/>
      <div className="w-full sm:w-3/4 lg:w-1/2 xl:w-1/2 bg-rose-200 shadow-lg rounded-lg p-6 z-10 border-2 border-black">
        <h1 className="text-3xl font-bold mb-4 text-center">DateCity: A Window.AI Experience</h1>
        <div className="overflow-y-auto h-96 mb-4">
          {messages.length === 0 && (
            <div className={`p-2 rounded-lg text-left whitespace-pre-wrap border-2 border-black text-lg font-semibold bg-violet-200 text-black`}>
              <div className='mb-4'>Welcome to DateCity!</div>
              <div className='mb-4'>In this dating sim, you have 100 days to take a woman home with you.</div>
              <div className='mb-4'>In this world, you can go to school, work out at the gym, get a job, and go to the bar to pick up women.</div>
              <div className='mb-4'>You will need to level up your stats and earn money to become a man who women want.</div>
              <div className='mb-4'>DateCity is an infinite world where you can do almost anything. Everything you do will impact your progress toward your goal of taking home a woman. If you wish to do something not listed here, simply type it in and watch it happen!</div>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className={`mb-2 ${message.role === 'user' ? 'text-right' : ''}`}>
              <span className={`inline-block p-2 rounded-lg text-left whitespace-pre-wrap border-2 border-black text-lg font-semibold ${message.role === 'user' ? 'bg-sky-200 text-black' : 'bg-violet-200 text-black'}`}>
                {message.content}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className={`flex-grow border-2 border-black bg-sky-200 rounded-lg p-2 focus:outline-none focus:border-violet-800 text-lg font-semibold ${messages.length === 0 && 'hidden'}`}
          />
          <button
            type="submit"
            disabled={loading}
            className={`${messages.length > 0 ? 'ml-2' : 'mx-auto'} border-2 border-black bg-yellow-200 text-black px-4 py-2 rounded-lg text-lg font-semibold ${loading ? 'opacity-50' : ''}`}
          >
            {loading ? 'Sending...' : messages.length === 0 ? 'Start Game' : 'Send'}
          </button>
        </form>
      </div>
      <Toaster />
    </div>
  );
};

export default App;