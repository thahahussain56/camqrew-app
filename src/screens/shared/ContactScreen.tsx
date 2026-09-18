import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Toast } from '../../components/ui/Toast';
import { supabase } from '../../api/supabaseClient';
import { MessageSquare, Send } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { IOSNavBar } from '../../components/navigation/IOSNavBar';
import { useNavBarHeight } from '../../hooks/useNavBarHeight';

export const ContactScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const navBarHeight = useNavBarHeight();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleSend = async () => {
    if (!name || !email || !message) {
      setToastMessage('Please fill in required fields.');
      return;
    }
    setLoading(true);

    const { error } = await supabase.from('contact_messages').insert([{
      name,
      email,
      subject: subject || 'No Subject',
      message,
      status: 'new'
    }]);

    setLoading(false);
    if (error) {
      setToastMessage('Failed to send message.');
    } else {
      setToastMessage('Message sent successfully!');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }
  };

  const openWhatsApp = () => {
    Linking.openURL('https://wa.me/919876543210?text=Hello%20Camqrew%20Studio%20Support');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <IOSNavBar
        title="Contact Us"
        showBack
        onPressBack={() => navigation.goBack()}
        backLabel="Back"
      />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: navBarHeight }]}>
        <Toast visible={!!toastMessage} message={toastMessage} type="success" onDismiss={() => setToastMessage('')} />

        <Card style={styles.card}>
          <Input label="Your Name" placeholder="Priya Sharma" value={name} onChangeText={setName} />
          <Input label="Email Address" placeholder="priya@domain.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Input label="Subject" placeholder="Booking query..." value={subject} onChangeText={setSubject} />
          <Input label="Message" placeholder="How can we help?" value={message} onChangeText={setMessage} multiline numberOfLines={4} style={{ height: 80 }} />

          <Button
            title="Send Message"
            variant="primary"
            size="lg"
            loading={loading}
            icon={<Send size={18} color="#000000" />}
            onPress={handleSend}
            style={{ marginTop: 10 }}
          />
        </Card>

        <TouchableOpacity activeOpacity={0.85} onPress={openWhatsApp} style={[styles.waBox, { backgroundColor: '#25D366' }]}>
          <MessageSquare size={20} color="#ffffff" style={{ marginRight: 10 }} />
          <Text style={styles.waText}>Chat directly on WhatsApp →</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  card: {
    marginBottom: 16,
  },
  waBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 14,
  },
  waText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
});
