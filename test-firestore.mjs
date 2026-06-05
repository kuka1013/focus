import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const p = doc(db, 'users/demo-user');
    await setDoc(p, { subjectsHistory: ['Math'] });
    console.log("Write pref success");
    const q = await getDocs(collection(db, 'users/demo-user/tasks'));
    console.log("Read tasks success:", q.size);
  } catch(e) {
    console.error("Error:", e);
  }
  process.exit();
}
test();
