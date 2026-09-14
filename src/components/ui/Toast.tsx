import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react-native';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onDismiss: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  onDismiss,
  duration = 3000,
}) => {
  const { colors } = useTheme();
  const [shouldRender, setShouldRender] = useState(visible);
  
  // Start hidden below the tab bar (translateY = 100)
  const translateY = useRef(new Animated.Value(100)).current; 
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      
      return () => clearTimeout(timer);
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 100, // Move back down behind the nav bar
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible, duration, onDismiss, translateY, opacity]);

  if (!shouldRender) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color={colors.success} />;
      case 'error':
        return <XCircle size={20} color={colors.danger} />;
      case 'warning':
        return <AlertTriangle size={20} color={colors.warning} />;
      case 'info':
      default:
        return <Info size={20} color={colors.accent} />;
    }
  };

  return (
    <Animated.View style={[
      styles.container, 
      { 
        backgroundColor: colors.surfaceCard, 
        borderColor: colors.border,
        opacity,
        transform: [{ translateY }]
      }
    ]}>
      {getIcon()}
      <Text style={[styles.text, { color: colors.textPrimary }]}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 95, // Positioned right above the floating navigation bar
    left: 20,
    right: 20,
    zIndex: 10, // Must be lower z-index than the bottom tab bar if we want it to look like it comes from behind
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  text: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});
