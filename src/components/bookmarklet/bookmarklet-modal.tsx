"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BookmarkletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookmarkletModal({ isOpen, onClose }: BookmarkletModalProps) {
  const [bookmarkletUrl, setBookmarkletUrl] = useState('');

  // Set up bookmarklet using DOM manipulation to bypass React security
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the modal is fully rendered
      const timer = setTimeout(() => {
        const button = document.getElementById('bookmarklet-button-modal');
        if (button && !button.getAttribute('data-converted')) {
          const bookmarkletCode = `(function(){try{console.log('=== vanwinkle BOOKMARKLET v4 ENHANCED SELECTORS ===');console.log('URL:',window.location.href);console.log('Document ready state:',document.readyState);var platform='Unknown';var platformEmoji='🤖';if(window.location.href.includes('chatgpt.com')||window.location.href.includes('chat.openai.com')){platform='ChatGPT';platformEmoji='🤖';}else if(window.location.href.includes('claude.ai')){platform='Claude';platformEmoji='🤖';}else if(window.location.href.includes('perplexity.ai')){platform='Perplexity';platformEmoji='🤖';}else if(window.location.href.includes('grok.com')){platform='Grok';platformEmoji='🤖';}else if(window.location.href.includes('g.co/gemini')||window.location.href.includes('gemini.google.com')){platform='Gemini';platformEmoji='🤖';}else if(window.location.href.includes('copilot.microsoft.com')){platform='Copilot';platformEmoji='🤖';}console.log('Detected platform:',platform);var platformSelectors={'ChatGPT':['main .prose','[data-message-author-role]','.group\\\\/conversation-turn','article'],'Claude':['.message','.chat-message','[data-role]','div[class*="message"]','article'],'Perplexity':['.conversation-item','.message-container','.search-result','.answer-container'],'Grok':['.conversation-turn','.message','.chat-bubble','.response-container'],'Gemini':['.message','.response-container','.conversation-item','[data-message-id]'],'Copilot':['.ac-textBlock','.response-message-group','.message-content','cib-message','[data-content]','.copilot-chat-turn','.turn-content','div[class*="turn"]','div[class*="message"]','div[class*="chat"]','[role="group"]','[role="listitem"]','article','p'],'Unknown':['main .prose','.conversation-turn','.message','.chat-message','[data-message-author-role]','.group\\\\/conversation-turn','article']};var selectors=platformSelectors[platform]||platformSelectors['Unknown'];console.log('Using selectors for',platform+':',selectors);var messages=[];for(var i=0;i<selectors.length;i++){var elements;try{elements=document.querySelectorAll(selectors[i]);}catch(selErr){console.log('Skipping invalid selector:',selectors[i],selErr);continue;}console.log('Trying selector:',selectors[i],'found',elements.length,'elements');if(elements.length>0){var candidateMessages=Array.from(elements).map(function(el){return el.innerText.trim();}).filter(function(text){return text.length>10;});console.log('Found',candidateMessages.length,'text blocks with selector:',selectors[i]);if(candidateMessages.length>0){messages=candidateMessages;console.log('Using messages from selector:',selectors[i]);break;}}}console.log('Total messages found:',messages.length);if(messages.length>0){console.log('First message preview:',messages[0].substring(0,100));}if(messages.length===0){console.log('Trying alternative approach - looking for any text content...');var allTextElements=document.querySelectorAll('p, div, span, article, section');var textBlocks=Array.from(allTextElements).map(function(el){return el.innerText.trim();}).filter(function(text){return text.length>20&&!text.includes('Skip to')&&!text.includes('Sign in')&&!text.includes('Settings');}).slice(0,20);if(textBlocks.length>0){messages=textBlocks;console.log('Found',messages.length,'text blocks using fallback method');}else{alert('❌ No messages found on this '+platform+' page.\\n\\nTry:\\n1. Make sure the conversation is loaded\\n2. Try a different page\\n3. Check browser console for details');return;}}var formatted='';if(platform==='ChatGPT'){var userMessages=document.querySelectorAll('[data-message-author-role="user"]');var assistantMessages=document.querySelectorAll('[data-message-author-role="assistant"]');var allMessages=[];userMessages.forEach(function(el){allMessages.push({type:'user',text:el.innerText.trim(),order:Array.from(document.querySelectorAll('[data-message-author-role]')).indexOf(el)});});assistantMessages.forEach(function(el){allMessages.push({type:'assistant',text:el.innerText.trim(),order:Array.from(document.querySelectorAll('[data-message-author-role]')).indexOf(el)});});allMessages.sort(function(a,b){return a.order-b.order;});formatted=allMessages.map(function(msg){return msg.type==='user'?'🧑 You:\\n'+msg.text:platformEmoji+' '+platform+':\\n'+msg.text;}).join('\\n\\n---\\n\\n');}else{formatted=messages.map(function(text,i){return i%2===0?'🧑 You:\\n'+text:platformEmoji+' '+platform+':\\n'+text;}).join('\\n\\n---\\n\\n');}var metaHeader='--- vanwinkle-meta ---\\nplatform: '+platform+'\\nurl: '+window.location.href+'\\n--- end-vanwinkle-meta ---\\n\\n';formatted=metaHeader+formatted;console.log('Formatted content length:',formatted.length);console.log('Using platform:',platform);console.log('🔍 Extracting citations from citation pills...');var citations=[];var citationPills=document.querySelectorAll('[data-testid="webpage-citation-pill"]');console.log('📊 Found',citationPills.length,'citation pills with selector [data-testid="webpage-citation-pill"]');console.log('🔍 Document ready state:',document.readyState);console.log('🔍 Current URL:',window.location.href);if(citationPills.length===0){console.log('⚠️ No citation pills found - trying alternative selectors...');var altPills=document.querySelectorAll('[class*="citation"],[class*="pill"],[data-testid*="citation"],[data-testid*="pill"]');console.log('🔍 Alternative selectors found',altPills.length,'potential elements');altPills.forEach(function(el,idx){console.log('🔍 Alt element',idx+1,':',el.tagName,el.className,el.getAttribute('data-testid'),'text:',el.innerText.substring(0,100));});}citationPills.forEach(function(pill,index){try{var pillText=pill.innerText.trim();var pillHTML=pill.outerHTML.substring(0,200);console.log('📋 Citation pill',index+1,':');console.log('  Text:',pillText);console.log('  HTML:',pillHTML);console.log('🔍 Extracting ALL citations from this pill...');var lines=pillText.split('\\n').filter(function(line){return line.trim().length>0;});console.log('  Lines found in pill:',lines.length,lines);for(var lineIndex=0;lineIndex<lines.length;lineIndex++){var line=lines[lineIndex].trim();var nextLine=lines[lineIndex+1];if(nextLine&&nextLine.includes('+')){var source=line;var number=nextLine.replace('+','').trim();console.log('  🔍 Found citation pair:',source,'+',number);if(source&&number&&!isNaN(parseInt(number))){citations.push({source:source,number:parseInt(number)});console.log('✅ Successfully extracted citation:',source,'+',number);lineIndex++;}else{console.log('⚠️ Invalid citation pair - source:',source,'number:',number);}}else if(line.includes('+')){var parts=line.split('+');if(parts.length===2){var source=parts[0].trim();var number=parts[1].trim();console.log('  🔍 Found inline citation:',source,'+',number);if(source&&number&&!isNaN(parseInt(number))){citations.push({source:source,number:parseInt(number)});console.log('✅ Successfully extracted citation:',source,'+',number);}else{console.log('⚠️ Invalid inline citation - source:',source,'number:',number);}}else{console.log('⚠️ Line contains + but not in expected format:',line);}}else{console.log('  📝 Line without citation:',line);}}console.log('  Total citations extracted from pill',index+1,':',citations.length);}catch(e){console.log('❌ Error processing citation pill',index+1,':',e);}});console.log('Total citations extracted:',citations.length);if(citations.length>0){console.log('Citations:',citations);console.log('🔍 Testing JSON serialization...');try{var citationsData=JSON.stringify(citations);console.log('✅ JSON.stringify result:',citationsData);console.log('🔍 JSON length:',citationsData.length);console.log('🔍 Testing JSON.parse...');var testParse=JSON.parse(citationsData);console.log('✅ JSON.parse test successful, parsed',testParse.length,'citations');}catch(jsonError){console.error('❌ JSON serialization failed:',jsonError);console.log('🔍 Attempting manual JSON construction...');var manualJson='[';citations.forEach(function(citation,index){if(index>0)manualJson+=',';manualJson+='{"source":"'+citation.source.replace(/"/g,'\\"')+'","number":'+citation.number+'}';});manualJson+=']';console.log('🔧 Manual JSON construction:',manualJson);citationsData=manualJson;}console.log('💾 Final citations data for URL:',citationsData);}setTimeout(function(){if(navigator.clipboard&&navigator.clipboard.writeText){console.log('🔄 Attempting clipboard write...');navigator.clipboard.writeText(formatted).then(function(){console.log('✅ SUCCESS: Clipboard write completed');console.log('Opening vanwinkle with content...');var shareUrl=encodeURIComponent(window.location.href);var platformParam=encodeURIComponent(platform.toLowerCase());console.log('💾 Using URL method with proper encoding for cross-domain compatibility');var contentParam=encodeURIComponent(formatted);var citationsParam=citations.length>0?encodeURIComponent(citationsData):'';console.log('🔗 Opening vanwinkle with content and citations in URL...');var vanwinkleUrl='https://www.vanwinkleapp.com/submit?from=bookmarklet&share='+shareUrl+'&platform='+platformParam+'&content='+contentParam;if(citationsParam){vanwinkleUrl+='&citations='+citationsParam;}window.open(vanwinkleUrl,'_blank');alert('✅ SUCCESS!\\n\\nCaptured '+formatted.length+' characters from '+platform+'.\\n\\nCitations found: '+citations.length+'\\n\\nvanwinkle is opening with your conversation...');}).catch(function(err){console.error('❌ CLIPBOARD FAILED:',err);alert('❌ CLIPBOARD FAILED\\n\\nError: '+err.message+'\\n\\nTry clicking the page first, then run bookmarklet again.');});}else{console.log('❌ No clipboard support');alert('❌ No clipboard support in this browser');}},500);}catch(e){console.error('BOOKMARKLET ERROR:',e);alert('❌ BOOKMARKLET ERROR\\n\\n'+e.message+'\\n\\nCheck browser console for details');}})();`;
          
          // Create an actual anchor element and set its href
          const link = document.createElement('a');
          link.href = `javascript:${bookmarkletCode}`;
          link.innerHTML = '💬 ' + button.innerHTML; // Add speech balloon for conversations
          link.className = button.className;
          link.draggable = true;
          link.setAttribute('data-converted', 'true');
          
          // Replace the div with the anchor
          if (button.parentNode) {
            button.parentNode.replaceChild(link, button);
          }
          
          setBookmarkletUrl(`javascript:${bookmarkletCode}`);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <span className="text-2xl">🚀</span>
            Install vanwinkle Bookmarklet
          </DialogTitle>
          <DialogDescription>
            Get started in 10 seconds - instantly share conversations from ChatGPT, Claude, Perplexity, Grok, Gemini, Copilot, and more!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Installation Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Step 1: Drag this button to your bookmarks bar ↓
              </h3>
              
              <div 
                id="bookmarklet-button-modal"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg cursor-grab active:cursor-grabbing select-none transition-colors duration-200 shadow-lg hover:shadow-xl"
                draggable={true}
                title="Drag to bookmarks bar - www.vanwinkleapp.com"
              >
                Save to vanwinkle
              </div>
              
              <div className="text-sm text-blue-700 space-y-2 mt-4">
                <p><strong>Step 2:</strong> Go to any AI conversation (ChatGPT, Claude, Perplexity, etc.)</p>
                <p><strong>Step 3:</strong> Click anywhere on the page first, then click the bookmark</p>
                <div className="bg-blue-100 p-3 rounded border border-blue-300 mt-3">
                  <p className="text-green-700">✅ <strong>Auto-detects platform + copies to clipboard + opens vanwinkle</strong></p>
                  <p className="text-blue-600">💡 <strong>Supports:</strong> ChatGPT, Claude, Perplexity, Grok, Gemini, Copilot</p>
                  <p className="text-blue-600">🚀 <strong>Mac app users:</strong> Share → Open in browser → Use bookmarklet</p>
                </div>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">💡 Can't drag?</h4>
            <p className="text-sm text-yellow-700 mb-2">
              Right-click the button above → "Bookmark this link" or "Add to bookmarks"
            </p>
            <details className="text-sm text-yellow-700">
              <summary className="cursor-pointer font-medium hover:text-yellow-800">
                ▶ Alternative: Manual Setup
              </summary>
              <div className="mt-2 p-3 bg-yellow-100 rounded border">
                <p className="mb-2">1. Right-click your bookmarks bar → "Add page" or "New bookmark"</p>
                <p className="mb-2">2. Name: <code className="bg-yellow-200 px-1 rounded">Save to vanwinkle</code></p>
                <p className="mb-2">3. URL: Copy this entire code:</p>
                <textarea 
                  className="w-full h-20 text-xs bg-white border border-yellow-300 rounded p-2 font-mono"
                  readOnly
                  value={bookmarkletUrl}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              </div>
            </details>
          </div>

          {/* How it Works */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">🔍 How it works:</h4>
            <ol className="list-decimal list-inside text-sm text-green-700 space-y-1">
              <li>On any AI conversation page, click the bookmarklet</li>
              <li>It auto-detects the platform (ChatGPT, Claude, etc.)</li>
              <li>Extracts and formats the conversation automatically</li>
              <li>Opens vanwinkle with content ready to submit</li>
              <li>Platform is automatically pre-selected for you!</li>
            </ol>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
