import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { aiAPI } from '../../services/api';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  "How much did I spend this month?",
  "Am I saving enough?",
  "What's my biggest expense?",
  "What's my net worth?",
  "Give me savings tips",
  "Can I afford a ₹50k purchase?",
];

export default function ChatScreen() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your MoneyMind AI assistant.\n\nI have access to all your financial data and can help you:\n• Analyze your spending patterns\n• Check if you're saving enough\n• Evaluate big purchases\n• Give personalized financial advice\n\nWhat would you like to know?`,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    Keyboard.dismiss();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Build chat history for context (last 8 messages)
      const history = messages
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

      const response: any = await aiAPI.chat(text.trim(), history);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⚠️ Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: '0',
      role: 'assistant',
      content: `Chat cleared! Ask me anything about your finances 💰`,
      timestamp: new Date(),
    }]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.aiAvatar}
            >
              <Text style={styles.aiAvatarText}>🤖</Text>
            </LinearGradient>
            <View>
              <Text style={styles.headerTitle}>MoneyMind AI</Text>
              <View style={styles.onlineIndicator}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online · Knows your finances</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageWrapper,
                msg.role === 'user' ? styles.userWrapper : styles.assistantWrapper,
              ]}
            >
              {msg.role === 'assistant' && (
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.assistantAvatar}
                >
                  <Text style={{ fontSize: 12 }}>🤖</Text>
                </LinearGradient>
              )}
              <View
                style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text style={[
                  styles.messageText,
                  msg.role === 'user' ? styles.userText : styles.assistantText,
                ]}>
                  {msg.content}
                </Text>
                <Text style={styles.messageTime}>
                  {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}

          {isLoading && (
            <View style={styles.assistantWrapper}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.assistantAvatar}
              >
                <Text style={{ fontSize: 12 }}>🤖</Text>
              </LinearGradient>
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.typingText}>Analyzing your finances...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick prompts */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickPromptsContainer}
          style={styles.quickPromptsScroll}
        >
          {QUICK_PROMPTS.map((prompt) => (
            <TouchableOpacity
              key={prompt}
              style={styles.quickPrompt}
              onPress={() => sendMessage(prompt)}
            >
              <Text style={styles.quickPromptText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about your finances..."
              placeholderTextColor={Colors.text.muted}
              multiline
              maxLength={500}
              onSubmitEditing={() => sendMessage(inputText)}
              returnKeyType="send"
            />
            <TouchableOpacity
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
              style={styles.sendButton}
            >
              <LinearGradient
                colors={inputText.trim() ? [Colors.primary, Colors.primaryDark] : ['#333', '#333']}
                style={styles.sendButtonGrad}
              >
                <Text style={styles.sendIcon}>↑</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <Text style={styles.inputHint}>Powered by Claude AI · Your data stays private</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(108,99,255,0.15)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiAvatar: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  aiAvatarText: { fontSize: 20 },
  headerTitle: { color: Colors.text.primary, fontSize: 17, fontWeight: '700' },
  onlineIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  onlineText: { color: Colors.text.muted, fontSize: 11 },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.card,
  },
  clearBtnText: { color: Colors.text.muted, fontSize: 12 },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16, gap: 12 },
  messageWrapper: { flexDirection: 'row', gap: 8, maxWidth: '90%' },
  userWrapper: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  assistantWrapper: { alignSelf: 'flex-start' },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    flexShrink: 0,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.15)',
  },
  messageText: { fontSize: 14, lineHeight: 20 },
  userText: { color: '#FFF' },
  assistantText: { color: Colors.text.primary },
  messageTime: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.15)',
  },
  typingText: { color: Colors.text.muted, fontSize: 13 },
  quickPromptsScroll: { maxHeight: 52 },
  quickPromptsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  quickPrompt: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.2)',
  },
  quickPromptText: { color: Colors.text.secondary, fontSize: 12 },
  inputContainer: {
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 95 : 85,
    borderTopWidth: 1,
    borderTopColor: 'rgba(108,99,255,0.15)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.2)',
    gap: 8,
  },
  textInput: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 2,
  },
  sendButton: { alignSelf: 'flex-end' },
  sendButtonGrad: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  inputHint: { color: Colors.text.muted, fontSize: 10, textAlign: 'center', marginTop: 6 },
});
