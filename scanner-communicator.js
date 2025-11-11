// scanner-communicator.js
// Общая библиотека для всех сканеров для отправки сигналов в War Room

class ScannerCommunicator {
    constructor(scannerName) {
        this.scannerName = scannerName;
        this.storageKey = 'crypto_scanner_signals';
        this.maxSignals = 50;
        this.lastSentSignals = new Map(); // Для предотвращения дублирования
    }

    // Основной метод отправки сигнала
    sendSignal(signalData) {
        try {
            // Проверяем, не отправляли ли мы уже этот сигнал (защита от дублирования)
            const signalKey = `${signalData.coin}_${signalData.direction}_${Math.round(signalData.confidence)}`;
            const now = Date.now();
            
            if (this.lastSentSignals.has(signalKey)) {
                const lastSent = this.lastSentSignals.get(signalKey);
                // Не отправляем тот же сигнал чаще чем раз в 30 секунд
                if (now - lastSent < 30000) {
                    console.log(`⏭️ Signal ${signalKey} already sent recently, skipping`);
                    return false;
                }
            }

            const signals = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
            
            // Ограничиваем размер хранилища
            this.ensureStorageLimit(signals);
            
            // Создаем уникальный ID для сигнала
            const signalId = `${this.scannerName}_${now}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Стандартизируем данные сигнала
            const standardizedSignal = this.standardizeSignalData(signalData);
            
            // Сохраняем сигнал
            signals[signalId] = {
                id: signalId,
                scanner: this.scannerName,
                timestamp: now,
                data: standardizedSignal,
                read: false
            };

            localStorage.setItem(this.storageKey, JSON.stringify(signals));
            
            // Запоминаем отправленный сигнал
            this.lastSentSignals.set(signalKey, now);
            
            console.log(`✅ [${this.scannerName}] Signal sent:`, standardizedSignal);
            return true;
            
        } catch (error) {
            console.error(`❌ [${this.scannerName}] Failed to send signal:`, error);
            return false;
        }
    }

    // Стандартизация данных сигнала
    standardizeSignalData(signalData) {
        return {
            coin: signalData.coin || 'UNKNOWN',
            direction: (signalData.direction || 'NEUTRAL').toUpperCase(),
            confidence: Math.min(100, Math.max(0, signalData.confidence || 50)),
            price: parseFloat(signalData.price) || 0,
            timeframe: signalData.timeframe || '5m',
            strength: Math.min(100, Math.max(0, signalData.strength || signalData.confidence || 50)),
            volume: signalData.volume || 0,
            scanners: signalData.scanners || [this.scannerName],
            message: signalData.message || '',
            probability: signalData.probability || signalData.confidence || 50,
            score: signalData.score || signalData.confidence || 50
        };
    }

    // Ограничение размера хранилища
    ensureStorageLimit(signals) {
        const signalKeys = Object.keys(signals);
        
        if (signalKeys.length >= this.maxSignals) {
            // Сортируем по времени и удаляем самые старые
            const sortedKeys = signalKeys.sort((a, b) => 
                signals[a].timestamp - signals[b].timestamp
            );
            
            // Удаляем 20% самых старых сигналов
            const keysToRemove = sortedKeys.slice(0, Math.floor(this.maxSignals * 0.2));
            keysToRemove.forEach(key => {
                delete signals[key];
            });
        }
    }

    // Метод для отправки быстрого тестового сигнала
    sendTestSignal() {
        const testSignals = [
            { coin: 'BTCUSDT', direction: 'LONG', confidence: 85, price: 45000, timeframe: '5m' },
            { coin: 'ETHUSDT', direction: 'SHORT', confidence: 75, price: 2500, timeframe: '15m' },
            { coin: 'SOLUSDT', direction: 'LONG', confidence: 90, price: 120, timeframe: '1h' }
        ];
        
        const randomSignal = testSignals[Math.floor(Math.random() * testSignals.length)];
        return this.sendSignal(randomSignal);
    }
}

// Глобальная инициализация для простоты использования
if (typeof window !== 'undefined') {
    window.ScannerComms = new ScannerCommunicator('unknown_scanner');
    
    // Функция для быстрой отправки
    window.sendScannerSignal = (scannerName, signalData) => {
        const comms = new ScannerCommunicator(scannerName);
        return comms.sendSignal(signalData);
    };
}

console.log('📡 Scanner Communicator loaded - ready to send signals to War Room!');