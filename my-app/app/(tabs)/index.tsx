import { Image, StyleSheet, Platform } from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';
import {NavigationContainer} from '@react-navigation/native';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import LoginScreen from '@/custom-components/auth/LoginScreen'
import RegisterScreen from '@/custom-components/auth/RegisterScreen'
import TodoScreen from '@/custom-components/todo/TodoScreen';
import AddTodoScreen from '@/custom-components/todo/AddToDo';
import EditTodoScreen from '@/custom-components/todo/EditToDo';
const Stack = createStackNavigator();

export default function HomeScreen() {
  return (
    <Stack.Navigator initialRouteName="LoginScreen">
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
      <Stack.Screen name="TodoScreen" component={TodoScreen} />
      <Stack.Screen name="AddTodoScreen" component={AddTodoScreen} />
      <Stack.Screen name="EditTodoScreen" component={EditTodoScreen} />  
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
