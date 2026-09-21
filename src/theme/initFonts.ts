import React from 'react';
import * as RN from 'react-native';

const OriginalText = RN.Text;
const OriginalTextInput = RN.TextInput;

/**
 * Maps React Native styles to the appropriate Google Sans font variant based on fontWeight.
 */
export const resolveGoogleSansFont = (style: any) => {
  if (!style) {
    return { fontFamily: 'GoogleSans-Regular' };
  }
  const flattened = RN.StyleSheet.flatten(style);
  if (!flattened) {
    return { fontFamily: 'GoogleSans-Regular' };
  }

  // If a custom icon font is already specified (like Ionicons, MaterialIcons, etc.), do not overwrite it
  if (
    flattened.fontFamily &&
    flattened.fontFamily !== 'System' &&
    !flattened.fontFamily.includes('GoogleSans') &&
    !flattened.fontFamily.includes('Google Sans') &&
    !flattened.fontFamily.includes('Product Sans')
  ) {
    return null;
  }

  const weight = String(flattened.fontWeight || '400');
  if (weight === '700' || weight === '800' || weight === '900' || weight === 'bold') {
    return { fontFamily: 'GoogleSans-Bold' };
  }
  if (weight === '600') {
    return { fontFamily: 'GoogleSans-SemiBold' };
  }
  if (weight === '500') {
    return { fontFamily: 'GoogleSans-Medium' };
  }
  return { fontFamily: 'GoogleSans-Regular' };
};

// Intercept RN.Text to automatically apply Google Sans across the entire application
const CustomText = React.forwardRef<any, any>((props, ref) => {
  const fontStyle = resolveGoogleSansFont(props.style);
  const combinedStyle = fontStyle ? [fontStyle, props.style] : props.style;
  return React.createElement(OriginalText, { ...props, ref, style: combinedStyle });
});

// Intercept RN.TextInput to automatically apply Google Sans across the entire application
const CustomTextInput = React.forwardRef<any, any>((props, ref) => {
  const fontStyle = resolveGoogleSansFont(props.style);
  const combinedStyle = fontStyle ? [fontStyle, props.style] : props.style;
  return React.createElement(OriginalTextInput, { ...props, ref, style: combinedStyle });
});

Object.assign(CustomText, OriginalText);
Object.assign(CustomTextInput, OriginalTextInput);

(RN as any).Text = CustomText;
(RN as any).TextInput = CustomTextInput;

try {
  (OriginalText as any).defaultProps = (OriginalText as any).defaultProps || {};
  (OriginalText as any).defaultProps.style = [{ fontFamily: 'GoogleSans-Regular' }, (OriginalText as any).defaultProps.style];

  (OriginalTextInput as any).defaultProps = (OriginalTextInput as any).defaultProps || {};
  (OriginalTextInput as any).defaultProps.style = [{ fontFamily: 'GoogleSans-Regular' }, (OriginalTextInput as any).defaultProps.style];
} catch (e) {
  // Ignore in environments where defaultProps is read-only
}
