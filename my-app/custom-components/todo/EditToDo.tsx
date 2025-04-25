
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
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const [description, setDescription] = useState<string>(todo.taskDescription|| '');
  const [date, setDate] = useState<Date>(todo.reminderTime ? todo.reminderTime.toDate() : new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(!!todo.reminderTime);
  const [loading, setLoading] = useState<boolean>(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const showDateTimePicker = () => {
    setShowDatePicker(true);
  };

  const handleUpdateTodo = async () => {
    if (title.trim() === '') {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    try {
      setLoading(true);
      const todoRef = doc(db, 'todos', todo.taskId);
      
      // Prepare update data
      const updateData: any = {
        title: title.trim(),
        description: description.trim(),
        updatedAt: Timestamp.fromDate(new Date()),
      };
      
      // Handle reminder changes
      if (reminderEnabled) {
        updateData.reminderTime = Timestamp.fromDate(date);
      } else {
        updateData.reminderTime = null;
      }
      
      await updateDoc(todoRef, updateData);
      if (reminderEnabled && date > new Date()) {
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
          date
        );
        navigation.navigate("TodoScreen") ; 
      } else {
        try {
          await cancelNotification(todo.taskId);
        } catch (error) {
          console.log('No notification to cancel');
        }
      }
    } catch (error) {
      console.error("Error updating task: ", error);
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
            <Text style={[
              styles.statusText,
              todo.taskStatus === 'COMPLETED' ? styles.completedStatus : styles.incompleteStatus
            ]}>
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
            <TouchableOpacity 
              style={styles.datePickerButton} 
              onPress={showDateTimePicker}
            >
              <Ionicons name="time-outline" size={20} color="#007bff" />
              <Text style={styles.dateText}>
                {date.toLocaleString()}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={date}
                mode="datetime"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
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