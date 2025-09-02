import { createContext, useContext } from "react";

const UserContext = createContext();
const useUserContext = () => useContext(UserContext);
export { UserContext, useUserContext };
