import { Timestamp } from "@react-native-firebase/firestore";

export interface TodoItem {
  taskId: string;
  taskTitle: string;
  taskDescription: string;
  taskStatus: "COMPLETED" | "INCOMPLETE";
  userId: string;
  createdAt: Timestamp;
  reminderTime: Timestamp | null;
  updatedAt: Timestamp;
}

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  TodoList: undefined;
  AddTodo: undefined;
  EditTodo: { todo: TodoItem };
};
