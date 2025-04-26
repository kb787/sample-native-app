import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/app/types/index';
import { Ionicons } from '@expo/vector-icons';
import { scheduleNotification } from '@/app/src/utils/notifications';

type AddTodoScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddTodo'>;

type Props = {
  navigation: AddTodoScreenNavigationProp;
};

const AddTodoScreen: React.FC<Props> = ({ navigation }) => {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(''); // Date in string format (YYYY-MM-DD)
  const [time, setTime] = useState<string>(''); // Time in string format (e.g., 7.10 for 7:10)
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleAddTodo = async () => {
    if (title.trim() === '') {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }
  
    if (reminderEnabled) {
      if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        Alert.alert('Error', 'Invalid date format. Use YYYY-MM-DD.');
        return;
      }
  
      let formattedTime = time.replace('.', ':');
      if (!formattedTime.match(/^\d{1,2}:\d{2}$/)) {
        Alert.alert('Error', 'Invalid time format. Use H.MM or HH.MM.');
        return;
      }
  
      const reminderDateTime = new Date(`${date}T${formattedTime}`);
      if (isNaN(reminderDateTime.getTime())) {
        Alert.alert('Error', 'Invalid date or time. Please check your inputs.');
        return;
      }
  
      if (reminderDateTime < new Date()) {
        Alert.alert('Error', 'Reminder date and time must be in the future.');
        return;
      }
    }
    navigation.navigate('TodoScreen');
    try {
      //setLoading(true);  Start loading when request begins
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }  
      const reminderDateTime = reminderEnabled && date && time
        ? new Date(`${date}T${time.replace('.', ':')}`)
        : null;
  
      const todoData = {
        title: title.trim(),
        description: description.trim(),
        status: 'INCOMPLETE' as const,
        userId: user.uid,
        createdAt: Timestamp.fromDate(new Date()),
        reminderTime: reminderDateTime ? Timestamp.fromDate(reminderDateTime) : null,
      };
  
      const docRef = await addDoc(collection(db, 'todos'), todoData);
      if (reminderEnabled && reminderDateTime && reminderDateTime > new Date()) {
        await scheduleNotification(
          docRef.id,
          title,
          description || 'Time to complete your task!',
          reminderDateTime
        );
      }
    } catch (error) {
      console.error('Error adding task: ', error);
      Alert.alert('Error', 'Failed to add task');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Task Title*</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter task title"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter task description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.reminderContainer}>
          <Text style={styles.label}>Set Reminder</Text>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setReminderEnabled(!reminderEnabled)}
          >
            <Ionicons
              name={reminderEnabled ? 'toggle' : 'toggle-outline'}
              size={32}
              color={reminderEnabled ? '#007bff' : '#757575'}
            />
          </TouchableOpacity>
        </View>

        {reminderEnabled && (
          <View style={styles.datePickerContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Enter Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={date}
                onChangeText={setDate}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Enter Time (H.MM or HH.MM) in 24hr format</Text>
              <TextInput
                style={styles.input}
                placeholder="H.MM or HH.MM"
                value={time}
                onChangeText={setTime}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddTodo}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>
            {loading ? 'Adding...' : 'Add Task'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  reminderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleButton: {
    padding: 5,
  },
  datePickerContainer: {
    marginBottom: 20,
  },
  addButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#007bff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddTodoScreen;