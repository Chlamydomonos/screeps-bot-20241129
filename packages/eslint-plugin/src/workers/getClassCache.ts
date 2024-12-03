import axios from 'axios';
import { runAsWorker } from 'synckit';

runAsWorker(async (file: string) => {
    try {
        return (await axios.post('http://127.0.0.1:25487/cache', { file })).data;
    } catch (e) {
        return 'serverNotOpen';
    }
});
