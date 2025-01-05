import { log } from './utils/log';
import uploadImageToGallery from './common/upload';

async function main() {
    try {
        await uploadImageToGallery();
    } catch (error) {
        log('主函数出错:' + error, 'error');
    }
}
    main();