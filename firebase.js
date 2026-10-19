import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "firebase/auth";
import { getFirestore, doc, getDocFromServer, setDoc, serverTimestamp } from "firebase/firestore";

export const app = initializeApp({
  apiKey: "AIzaSyAzho6PkDKidcTUD26BL5uwewta50EBO-8",
  authDomain: "volleyball-c6146.firebaseapp.com",
  projectId: "volleyball-c6146",
  storageBucket: "volleyball-c6146.firebasestorage.app",
  messagingSenderId: "309544687461",
  appId: "1:309544687461:web:7bf57fbe5389dfda53b38c",
  measurementId: "G-079RN5MLZV"
});

export const auth = getAuth(app);
export const db = getFirestore(app);
// Analytics failure must never prevent the game from starting.
isSupported().then((supported) => {
  if (supported) getAnalytics(app);
}).catch((error) => console.warn("Firebase Analytics unavailable", error));

export function watchAccount(callback) {
  return onAuthStateChanged(auth, callback);
}

export function authenticate(mode, email, password) {
  const action = mode === "register" ? createUserWithEmailAndPassword : signInWithEmailAndPassword;
  return action(auth, email, password);
}

export const logoutAccount = () => signOut(auth);

export async function readCloudSave(uid) {
  let timer;
  try {
    const snapshot = await Promise.race([
      getDocFromServer(doc(db, "players", uid)),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(Object.assign(new Error("Cloud load timed out"), { code: "unavailable" })), 12000);
      })
    ]);
    return snapshot.exists() ? snapshot.data() : null;
  } finally {
    clearTimeout(timer);
  }
}

export function writeCloudSave(uid, save) {
  return setDoc(doc(db, "players", uid), { ...save, updatedAt: serverTimestamp() });
}

export function firebaseErrorMessage(error) {
  const messages = {
    "auth/invalid-email": "이메일 주소를 확인하세요.",
    "auth/invalid-credential": "이메일 또는 비밀번호를 확인하세요.",
    "auth/user-not-found": "이메일 또는 비밀번호를 확인하세요.",
    "auth/wrong-password": "이메일 또는 비밀번호를 확인하세요.",
    "auth/email-already-in-use": "이미 가입한 이메일입니다.",
    "auth/weak-password": "비밀번호는 6자 이상으로 입력하세요.",
    "auth/password-does-not-meet-requirements": "프로젝트의 비밀번호 조건을 확인하세요.",
    "auth/too-many-requests": "잠시 후 다시 시도하세요.",
    "auth/network-request-failed": "인터넷 연결을 확인하세요.",
    "auth/operation-not-allowed": "Firebase 콘솔에서 이메일/비밀번호 로그인을 활성화하세요.",
    "auth/unauthorized-domain": "Firebase 콘솔에 현재 사이트 도메인을 등록하세요.",
    "permission-denied": "클라우드 저장 권한을 확인하세요. Firestore 규칙 설정이 필요합니다.",
    "unavailable": "클라우드에 연결할 수 없습니다. 잠시 후 다시 시도하세요."
  };
  return messages[error.code] || "Firebase 연결에 실패했습니다. 설정과 인터넷 연결을 확인하세요.";
}
