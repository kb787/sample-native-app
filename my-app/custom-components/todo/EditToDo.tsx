
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { scheduleNotification, cancelNotification } from '@/app/src/utils/notifications';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, TodoItem } from '@/app/types/index';
import { Ionicons } from '@expo/vector-icons';

type EditTodoScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditTodo'>;
type EditTodoScreenRouteProp = RouteProp<RootStackParamList, 'EditTodo'>;

type Props = {
  navigation: EditTodoScreenNavigationProp;
  route: EditTodoScreenRouteProp;
};

const EditTodoScreen: React.FC<Props> = ({ navigation, route }) => {
    const { todo } = route.params;
  
    const [title, setTitle] = useState<string>(todo.taskTitle);
    const [description, setDescription] = useState<string>(todo.taskDescription || '');
    const [date, setDate] = useState<string>(
      todo.reminderTime ? todo.reminderTime.toDate().toISOString().split('T')[0] : ''
    ); // Extract date in YYYY-MM-DD format
    const [time, setTime] = useState<string>(
      todo.reminderTime
        ? todo.reminderTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(':', '.')
        : ''
    ); // Extract time in H.MM or HH.MM format
    const [reminderEnabled, setReminderEnabled] = useState<boolean>(!!todo.reminderTime);
    const [loading, setLoading] = useState<boolean>(false);
  
    const handleUpdateTodo = async () => {
      if (title.trim() === '') {
        Alert.alert('Error', 'Please enter a task title');
        return;
      }
  
      if (reminderEnabled) {
        // Validate date format
        if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          Alert.alert('Error', 'Invalid date format. Use YYYY-MM-DD.');
          return;
        }
  
        // Validate and convert time format
        let formattedTime = time.replace('.', ':'); // Replace '.' with ':'
        if (!formattedTime.match(/^\d{1,2}:\d{2}$/)) {
          Alert.alert('Error', 'Invalid time format. Use H.MM or HH.MM.');
          return;
        }
  
        // Combine date and time into a single Date object
        const reminderDateTime = new Date(`${date}T${formattedTime}`);
        if (isNaN(reminderDateTime.getTime())) {
          Alert.alert('Error', 'Invalid date or time. Please check your inputs.');
          return;
        }
  
        if (reminderDateTime <= new Date()) {
          Alert.alert('Error', 'Reminder date and time must be in the future.');
          return;
        }
      }
  
      try {
        // setLoading(true);
        const todoRef = doc(db, 'todos', todo.taskId);
  
        // Prepare update data
        const updateData: any = {
          title: title.trim(),
          description: description.trim(),
          updatedAt: Timestamp.fromDate(new Date()),
        };
        navigation.navigate('TodoScreen');
        // Handle reminder changes
        if (reminderEnabled) {
          const reminderDateTime = new Date(`${date}T${time.replace('.', ':')}`);
          updateData.reminderTime = Timestamp.fromDate(reminderDateTime);
        } else {
          updateData.reminderTime = null;
        }
        
        await updateDoc(todoRef, updateData);
  
        if (reminderEnabled && date && time) {
          const reminderDateTime = new Date(`${date}T${time.replace('.', ':')}`);
          if (reminderDateTime > new Date()) {
            // Cancel previous notification if it exists
            try {
              await cancelNotification(todo.taskId);
            } catch (error) {
              console.log('No previous notification to cancel');
            }
  
            // Schedule new notification
            await scheduleNotification(
              todo.taskId,
              title,
              description || 'Time to complete your task!',
              reminderDateTime
            );
          }
        } else {
          try {
            await cancelNotification(todo.taskId);
          } catch (error) {
            console.log('No notification to cancel');
          }
        }
      } catch (error) {
        console.error('Error updating task: ', error);
        Alert.alert('Error', 'Failed to update task');
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
  
          <View style={styles.statusContainer}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusBadge}>
              <Text
                style={[
                  styles.statusText,
                  todo.taskStatus === 'COMPLETED' ? styles.completedStatus : styles.incompleteStatus,
                ]}
              >
                {todo.taskStatus}
              </Text>
            </View>
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
                <Text style={styles.label}>Select Time (H.MM or HH.MM)</Text>
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
            style={styles.updateButton}
            onPress={handleUpdateTodo}
            disabled={loading}
          >
            <Text style={styles.updateButtonText}>
              {loading ? 'Updating...' : 'Update Task'}
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    marginLeft: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontWeight: 'bold',
  },
  completedStatus: {
    color: '#4CAF50',
  },
  incompleteStatus: {
    color: '#FF9800',
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
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
  },
  dateText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  updateButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#007bff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditTodoScreen;