import * as React from 'react';
import { LuBot } from 'react-icons/lu';
import Markdown from 'react-markdown';
import useChatScroll from '../hooks/useChatScroll';
import useChatbot from '../hooks/useChatbot';
import { generate } from '@pdfme/generator';
import { pdfTemplate } from '../pdf/template'; // adjust path if needed



interface Message {
  text: string;
  sender: 'user' | 'bot';
}

const questions = [
  {
    key: 'name',
    text: 'What is your full name?',
  },
  {
    key: 'address',
    text: 'What is your mailing address?',
  },
  {
    key: 'cityStateZip',
    text: 'City, State, and ZIP code?',
  },
  {
    key: 'email',
    text: 'What is your email address?',
  },
  {
    key: 'phone',
    text: 'What phone number should we include?',
  },
  {
    key: 'job',
    text: 'What job are you applying for, and where is it located?',
  },
  {
    key: 'experience',
    text: 'Can you tell me about your work experience?',
  },
  {
    key: 'company',
    text: 'What company is this job at?',
  },
  {
    key: 'fit',
    text: 'Why does this job sound like a good fit for you?',
  },
  {
    key: 'tone',
    text: 'What kind of tone would you like the letter to have? (e.g., formal, warm, confident)',
  },
];





const ChatComponent: React.FunctionComponent = () => {
  const [input, setInput] = React.useState("");
  const [answers, setAnswers] = React.useState<{ [key: string]: string }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const { messages, sendMessage, addMessage } = useChatbot();
  const ref = useChatScroll(messages);
  const [clippyState, setClippyState] = React.useState<'idle' | 'thinking' | 'talking'>('idle');
  const initialLoadRef = React.useRef(true);

  React.useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
  
      const alreadyAsked = messages.some(
        (msg) => msg.text === questions[0].text && msg.sender === 'bot'
      );
  
      if (!alreadyAsked) {
        addMessage({
          text: questions[0].text,
          sender: 'bot',
        });
      }
    }
  }, []);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const generatePdfFromText = async (fullText: string) => {
    const inputs = [{
      header: `${answers.name} - Cover Letter`,
      contact: `${answers.email} | ${answers.phone}`,
      body: fullText,
      signature: `Sincerely,\n${answers.name}`,
    }];    
  
    const pdf = await generate({ template: pdfTemplate, inputs });
  
    const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
  
    addMessage({
      text: "Looks like you're writing a cover letter! 📄 Here's your download link:",
      sender: 'bot',
    });

    addMessage({
      text: url,
      sender: 'bot',
    });
  };  

  const handleSend = () => {
    if (!input.trim()) return;

    const currentQuestion = questions[currentQuestionIndex];

    addMessage({ text: input, sender: 'user' });
    const updatedAnswers = { ...answers, [currentQuestion.key]: input };
    setAnswers(updatedAnswers);
    setInput("");
    
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex < questions.length) {
      setTimeout(() => {
        addMessage({
          text: questions[nextIndex].text,
          sender: 'bot',
        });
        setCurrentQuestionIndex(nextIndex);
      }, 500);
    } else {
      const prompt = `
      You are a helpful assistant generating a cover letter for a job seeker.
      
      Please write a polished, professional, and friendly cover letter using the following details:
      
      Name: ${answers.name}
      Address: ${answers.address}
      City/State/Zip: ${answers.cityStateZip}
      Email: ${answers.email}
      Phone: ${answers.phone}
      Date: ${new Date().toLocaleDateString()}
      
      Job Title: ${answers.job}
      Company: ${answers.company}
      Location: (if included in job field): ${answers.job.includes(" at ") ? "" : answers.company}
      
      Experience: ${answers.experience}
      Why it's a good fit: ${answers.fit}
      Tone: ${answers.tone || "professional and friendly"}
      
      Make sure the final letter flows like a real human wrote it. Start with their contact info, then the greeting (e.g., “Dear Hiring Manager,”), followed by the body, and a closing paragraph with their name at the end.
      
      Do not include placeholders like [Your Name] — fill everything in. Keep the formatting appropriate for a Microsoft Word-style letter.
      `;
    
      setClippyState('thinking');
    
      sendMessage(prompt).then((botReply) => {
        if (botReply) {
          setClippyState('talking');
          setTimeout(() => setClippyState('idle'), 2000);
          generatePdfFromText(botReply);
        } else {
          setClippyState('idle');
        }
      });
    }
  };

  return (
    <div className="flex flex-col h-[80vh] w-full max-w-xl mx-auto bg-[#d4d0c8] border border-gray-600 shadow-[inset_-2px_-2px_0px_#fff,inset_2px_2px_0px_#808080] font-[Tahoma,sans-serif] text-sm">
<div className="bg-[#0a246a] h-8 text-white px-3 py-1 text-sm font-bold flex items-center gap-2 shadow-[inset_-1px_-1px_0px_#000,inset_1px_1px_0px_#fff]">
  <LuBot size={18} className="text-white" />
  Clippy 2.0 Cover Letter Helper
</div>

      {/* Chat Messages */}
      <div ref={ref} className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg: Message, index: number) => (
          <div
            key={index}
            className={`p-3 max-w-[85.7%] text-sm border
              ${
                msg.sender === 'bot'
                  ? 'bg-[#fff8c6] text-black font-[Comic_Sans_MS,cursive]'
                  : 'bg-[#f0f0f0] text-black font-[Tahoma,sans-serif]'
              }
              border-gray-500
              shadow-[inset_-1px_-1px_0px_#fff,inset_1px_1px_0px_#808080]
              whitespace-pre-wrap break-words overflow-visible
            `}
          >
            {msg.text.startsWith('blob:') ? (
              <a
                href={msg.text}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-700"
              >
                📄 Download your cover letter (PDF)
              </a>
            ) : (
            <Markdown>{msg.text}</Markdown>
            )}
          </div>
        ))}
      </div>

      {/* Input Box */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#d4d0c8] border-t border-gray-600 shadow-[inset_-1px_-1px_0px_#fff,inset_1px_1px_0px_#808080]">
        <input
          type="text"
          className="flex-1 px-2 py-1 bg-white text-black border border-gray-500 shadow-[inset_1px_1px_0px_#fff,inset_-1px_-1px_0px_#808080] outline-none text-sm font-[Tahoma,sans-serif]"
          placeholder="Your answer..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend}
         className="px-4 py-1 bg-[#d4d0c8] text-black border border-gray-600 shadow-[inset_1px_1px_0px_#fff,inset_-1px_-1px_0px_#808080] active:shadow-none text-sm font-[Tahoma,sans-serif]"
         >
          Send
        </button>
      </div>
      <img
      src={
        clippyState === 'thinking'
          ? '/clippy/clippy-thinking.png'
          : clippyState === 'talking'
          ? '/clippy/clippy-talking.png'
          : '/clippy/clippy-neutral.png'
      }
      alt="Clippy"
      className="w-48 h-48 fixed bottom-[calc(2rem+60px)] left-[calc(50%-480px)] transition-all drop-shadow-lg"
      draggable={false}
    />

    </div>
  );
};

export default ChatComponent;
