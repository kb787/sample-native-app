import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { signOut } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/firebaseConfig";
import { TodoItem, RootStackParamList } from "@/app/types/index";
import { format } from "date-fns";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";

type TodoListScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "TodoList"
>;

type Props = {
  navigation: TodoListScreenNavigationProp;
};

const TodoScreen: React.FC<Props> = ({ navigation }) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<"createdAt" | "reminderTime">(
    "createdAt"
  );
  const [lastVisible, setLastVisible] = useState<any>(null); // Added for pagination
  const handleRefreshing = async () => {
    setRefreshing(true);
    await fetchTodos();
  };
  useFocusEffect(
    React.useCallback(() => {
      fetchTodos();
      return () => {};
    }, [sortOption])
  );

  const fetchTodos = async (lastDoc?: any) => {
    try {
      setLoading(true);
      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      // Added pagination with limit and startAfter
      let q = query(
        collection(db, "todos"),
        where("userId", "==", user.uid),
        orderBy(sortOption, "asc")
        // Fetch 10 tasks at a time
      );

      if (lastDoc) {
        q = query(q, lastDoc);
      }

      const querySnapshot = await getDocs(q);
      const todoList: TodoItem[] = [];
      let lastFetchedDoc = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        todoList.push({
          taskId: doc.id,
          taskTitle: data.title,
          taskDescription: data.description,
          taskStatus: data.status,
          userId: data.userId,
          createdAt: data.createdAt,
          reminderTime: data.reminderTime,
          updatedAt: data.updatedAt,
        });
        lastFetchedDoc = doc; // Track the last document for pagination
      });

      setTodos((prevTodos) => [...prevTodos, ...todoList]); // Append new tasks to the existing list
      setLastVisible(lastFetchedDoc); // Update the last visible document
    } catch (error) {
      console.error("Error fetching todos: ", error);
      Alert.alert("Error", "Failed to load tasks");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (!loading && lastVisible) {
      await fetchTodos(lastVisible); // Fetch the next batch of tasks
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.navigate("LoginScreen");
      // Navigation will be handled by App.tsx
    } catch (error) {
      Alert.alert("Error", "Failed to log out");
    }
  };
 
  // const toggleTaskStatus = (id: string, currentStatus: string) => {
  //   const confirmToggle = async () => {
  //     try {
  //       setLoading(true); // Show loading indicator
        
  //       const todoRef = doc(db, "todos", id);
  //       const newStatus = currentStatus === "COMPLETED" ? "INCOMPLETE" : "COMPLETED";
  
  //       await updateDoc(todoRef, {
  //         status: newStatus,
  //         updatedAt: Timestamp.now(),
  //       });
  
  //       // Update the local state immediately for better UX
  //       setTodos((todos) =>
  //         todos.map((todo) =>
  //           todo.taskId === id
  //             ? {
  //                 ...todo,
  //                 taskStatus: newStatus as "COMPLETED" | "INCOMPLETE",
  //               }
  //             : todo
  //         )
  //       );
  //     } catch (error) {
  //       console.error("Error updating task status: ", error);
  //       Alert.alert("Error", "Failed to update task status");
  //     } finally {
  //       setLoading(false); // Hide loading indicator
  //     }
  //   };
  
  //   Alert.alert(
  //     "Update Status",
  //     "Are you sure you want to update task status?",
  //     [
  //       { text: "Cancel", style: "cancel" },
  //       { text: "Update", style: "default", onPress: confirmToggle },
  //     ]
  //   );
  // };

  const toggleTaskStatus = async (id: string, currentStatus: string) => {
    try {
      // Immediately update local state for responsive UI
      const newStatus = currentStatus === "COMPLETED" ? "INCOMPLETE" : "COMPLETED";
      
      // Optimistic UI update
      setTodos(prevTodos =>
        prevTodos.map(todo =>
          todo.taskId === id
            ? { ...todo, taskStatus: newStatus as "COMPLETED" | "INCOMPLETE" }
            : todo
        )
      );
  
      // Update in Firestore
      const todoRef = doc(db, "todos", id);
      await updateDoc(todoRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
  
    } catch (error) {
      console.error("Error updating task status: ", error);
      
      // Revert optimistic update if there was an error
      setTodos(prevTodos =>
        prevTodos.map(todo =>
          todo.taskId === id
            ? { ...todo, taskStatus: currentStatus as "COMPLETED" | "INCOMPLETE" }
            : todo
        )
      );
      
      Alert.alert("Error", "Failed to update task status");
    }
  };
  
  // Usage with confirmation dialog:
  const handleStatusToggle = (id: string, currentStatus: string) => {
    Alert.alert(
      "Update Status",
      "Are you sure you want to update task status?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Update", 
          style: "default", 
          onPress: () => toggleTaskStatus(id, currentStatus) 
        },
      ]
    );
  };
  const deleteTask = (id: string) => {
    const confirmDelete = async () => {
      try {
        setLoading(true); // Show loading indicator
        
        await deleteDoc(doc(db, "todos", id));
        
        // Update the local state immediately for better UX
        setTodos((todos) => {
          return todos.filter((todo) => todo.taskId !== id)
      });

        
        // Optional: refresh the list to ensure consistency with server
        // await fetchTodos();
      } catch (error) {
        console.error("Error deleting task: ", error);
        Alert.alert("Error", "Failed to delete task");
      } finally {
        setLoading(false); // Hide loading indicator
      }
    };
  
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: confirmDelete,
      },
    ]);
  };
  const renderTodoItem = ({ item }: { item: TodoItem }) => {
    const formattedDate = item.reminderTime
      ? format(item.reminderTime.toDate(), "MMM d, yyyy h:mm a")
      : "No reminder set";

    return (
      <View style={styles.todoItem}>
        <TouchableOpacity
          style={styles.statusButton}
          onPress={() => handleStatusToggle(item.taskId, item.taskStatus)}
        >
          <Ionicons
            name={
              item.taskStatus === "COMPLETED"
                ? "checkmark-circle"
                : "ellipse-outline"
            }
            size={24}
            color={item.taskStatus === "COMPLETED" ? "#4CAF50" : "#757575"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.todoContent}
          onPress={() => navigation.navigate("EditTodoScreen", { todo: item })}
        >
          <Text
            style={[
              styles.todoTitle,
              item.taskStatus === "COMPLETED" && styles.completedText,
            ]}
            numberOfLines={1}
          >
            {item.taskTitle}
          </Text>
          <Text style={styles.todoDescription} numberOfLines={1}>
            {item.taskDescription || "No description"}
          </Text>
          <View style={styles.todoMeta}>
            <Ionicons name="time-outline" size={14} color="#757575" />
            <Text style={styles.todoDate}>{formattedDate}</Text>
          </View>
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
            setSortOption(
              sortOption === "createdAt" ? "reminderTime" : "createdAt"
            );
          }}
        >
          <Ionicons name="funnel-outline" size={24} color="#333" />
          <Text style={styles.sortText}>
            Sort by{" "}
            {sortOption === "createdAt" ? "Date Added" : "Reminder Time"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF5252" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && todos.length === 0) {
    // Show loader only if no tasks are loaded
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
          keyExtractor={(item) => item.taskId}
          contentContainerStyle={styles.todoList}
          onEndReached={handleLoadMore} // Added pagination
          onEndReachedThreshold={0.5} // Trigger when 50% of the list is visible
          initialNumToRender={10} // Render only 10 items initially
          maxToRenderPerBatch={10} // Render 10 items per batch
          windowSize={5} // Keep 5 items in memory
          removeClippedSubviews={true}
          // refreshControl={
          //   <RefreshControl refreshing={refreshing} onRefresh={handleRefreshing} /> // Added RefreshControl
          // }
          // Remove items outside the viewport
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="list-outline" size={64} color="#BDBDBD" />
          <Text style={styles.emptyText}>You don't have any tasks yet</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddTodoScreen")}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortText: {
    marginLeft: 5,
    color: "#333",
  },
  logoutButton: {
    padding: 5,
  },
  todoList: {
    padding: 15,
  },
  todoItem: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusButton: {
    paddingRight: 10,
    justifyContent: "center",
  },
  todoContent: {
    flex: 1,
    justifyContent: "center",
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#757575",
  },
  todoDescription: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 4,
  },
  todoMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  todoDate: {
    fontSize: 12,
    color: "#757575",
    marginLeft: 4,
  },
  deleteButton: {
    padding: 5,
    justifyContent: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: "#757575",
  },
  overlayLoading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1000,
  }
});

export default TodoScreen;
