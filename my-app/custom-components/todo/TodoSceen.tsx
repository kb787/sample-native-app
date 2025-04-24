
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';
import { TodoItem, RootStackParamList } from '@/app/types/index';
import { format } from 'date-fns';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

type TodoListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TodoList'>;

type Props = {
  navigation: TodoListScreenNavigationProp;
};

const TodoScreen: React.FC<Props> = ({ navigation }) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortOption, setSortOption] = useState<'createdAt' | 'reminderTime'>('createdAt');

  // Load todos when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      fetchTodos();
      return () => {};
    }, [sortOption])
  );

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      
      // Create the query based on the current sort option
      const q = query(
        collection(db, 'todos'),
        where('userId', '==', user.uid),
        orderBy(sortOption, 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const todoList: TodoItem[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        todoList.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          status: data.status,
          userId: data.userId,
          createdAt: data.createdAt,
          reminderTime: data.reminderTime,
          updatedAt: data.updatedAt
        });
      });
      
      setTodos(todoList);
    } catch (error) {
      console.error("Error fetching todos: ", error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Navigation will be handled by App.tsx
    } catch (error) {
      Alert.alert('Error', 'Failed to log out');
    }
  };

  const toggleTaskStatus = async (id: string, currentStatus: string) => {
    try {
      const todoRef = doc(db, 'todos', id);
      const newStatus = currentStatus === 'COMPLETED' ? 'INCOMPLETE' : 'COMPLETED';
      
      await updateDoc(todoRef, {
        status: newStatus,
        updatedAt: Timestamp.now()
      });
      
      // Update local state
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo.id === id ? { ...todo, status: newStatus as 'COMPLETED' | 'INCOMPLETE' } : todo
        )
      );
    } catch (error) {
      console.error("Error updating task status: ", error);
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const deleteTask = async (id: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'todos', id));
              // Update local state
              setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
            } catch (error) {
              console.error("Error deleting task: ", error);
              Alert.alert('Error', 'Failed to delete task');
            }
          }
        }
      ]
    );
  };

  const renderTodoItem = ({ item }: { item: TodoItem }) => {
    const formattedDate = item.reminderTime 
      ? format(item.reminderTime.toDate(), 'MMM d, yyyy h:mm a')
      : 'No reminder set';
    
    return (
      <View style={styles.todoItem}>
        <TouchableOpacity 
          style={styles.statusButton}
          onPress={() => toggleTaskStatus(item.id, item.status)}
        >
          <Ionicons 
            name={item.status === 'COMPLETED' ? 'checkmark-circle' : 'ellipse-outline'} 
            size={24} 
            color={item.status === 'COMPLETED' ? '#4CAF50' : '#757575'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.todoContent}
          onPress={() => navigation.navigate('EditTodo', { todo: item })}
        >
          <Text 
            style={[
              styles.todoTitle,
              item.status === 'COMPLETED' && styles.completedText
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.todoDescription} numberOfLines={1}>
            {item.description || 'No description'}
          </Text>
          <View style={styles.todoMeta}>
            <Ionicons name="time-outline" size={14} color="#757575" />
            <Text style={styles.todoDate}>{formattedDate}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteTask(item.id)}
        >
          <Ionicons name="trash-outline" size={24} color="#FF5252" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Task List</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => {
            setSortOption(sortOption === 'createdAt' ? 'reminderTime' : 'createdAt');
          }}
        >
          <Ionicons name="funnel-outline" size={24} color="#333" />
          <Text style={styles.sortText}>
            Sort by {sortOption === 'createdAt' ? 'Date Added' : 'Reminder Time'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#FF5252" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      {todos.length > 0 ? (
        <FlatList
          data={todos}
          renderItem={renderTodoItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.todoList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="list-outline" size={64} color="#BDBDBD" />
          <Text style={styles.emptyText}>You don't have any tasks yet</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddTodo')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    marginLeft: 5,
    color: '#333',
  },
  logoutButton: {
    padding: 5,
  },
  todoList: {
    padding: 15,
  },
  todoItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusButton: {
    paddingRight: 10,
    justifyContent: 'center',
  },
  todoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#757575',
  },
  todoDescription: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  todoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todoDate: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 4,
  },
  deleteButton: {
    padding: 5,
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#757575',
  },
});

export default TodoScreen;