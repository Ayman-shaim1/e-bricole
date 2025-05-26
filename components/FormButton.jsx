import React from 'react';
import { useFormikContext } from 'formik';
import StyledButton from './StyledButton';

/**
 * A reusable form button component that integrates with Formik
 * 
 * @param {Object} props - Component props
 * @param {string} props.text - Button text
 * @param {Function} props.onPress - Optional custom onPress handler (defaults to formik submit)
 * @param {Object} props.buttonProps - Additional props for StyledButton
 */
export default function FormButton({ 
  text, 
  onPress,
  ...buttonProps 
}) {
  const { handleSubmit, isSubmitting, isValid, dirty } = useFormikContext();
  
  // Use custom onPress if provided, otherwise use formik's handleSubmit
  const handlePress = onPress || handleSubmit;
  
  return (
    <StyledButton
      text={text}
      onPress={handlePress}
      disabled={isSubmitting || (!isValid && dirty)}
      {...buttonProps}
    />
  );
}
