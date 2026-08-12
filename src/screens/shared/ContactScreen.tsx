import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Toast } from '../../components/ui/Toast';
import { Mail, Phone, MessageSquare, Send } from 'lucide-react-native';

export const ContactScreen: React.FC = () => {
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleSend = () => {
    if (!name || !email || !message) {
      setToastMessage('Please fill in required fields.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setToastMessage('Message sent successfully!');
      setName('');
      setEmail('');
      setMessage('');
    }, 1000);
  };

  const openWhatsApp = () => {
    Linking.openURL('https://wa.me/919876543210?text=Hello%20Camcrew%20Studio%20Support');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Toast visible={!!toastMessage} message={toastMessage} type="success" onDismiss={() => setToastMessage('')} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Contact Camcrew Support</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          We are available 24/7 to assist with your bookings, gear orders, and studio inquiries.
        </Text>
      </View>

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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 68,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
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
