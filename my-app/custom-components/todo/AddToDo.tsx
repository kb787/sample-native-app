
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

type AddTodoScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddTodo'>;

type Props = {
  navigation: AddTodoScreenNavigationProp;
};

const AddTodoScreen: React.FC<Props> = ({ navigation }) => {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(''); // Date in string format (YYYY-MM-DD)
  const [time, setTime] = useState<string>(''); // Time in string format (HH:mm)
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleAddTodo = async () => {
    if (title.trim() === '') {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;

      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Combine date and time into a single Date object
      const reminderDateTime = reminderEnabled && date && time ? new Date(`${date}T${time}`) : null;

      const todoData = {
        title: title.trim(),
        description: description.trim(),
        status: 'INCOMPLETE' as const,
        userId: user.uid,
        createdAt: Timestamp.fromDate(new Date()),
        reminderTime: reminderDateTime ? Timestamp.fromDate(reminderDateTime) : null,
      };

      const docRef = await addDoc(collection(db, 'todos'), todoData);

      navigation.goBack();
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
              <Text style={styles.label}>Select Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={date}
                onChangeText={setDate}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Time (HH:mm)</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:mm"
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