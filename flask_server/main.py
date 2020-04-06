from flask import Flask, jsonify
import serial
import time

app = Flask(__name__)

ser = serial.Serial('/dev/cu.usbserial-14110', 9600)  # Establish the connection on a specific port
# ser1 = serial.Serial('/dev/cu.usbserial-14120', 9600)  # Establish the connection on a specific port
ser2 = serial.Serial('/dev/cu.usbserial-14140', 9600)
# f = []
xsum = 0
ysum = 0
zsum = 0
xsum1 = 0
ysum1 = 0
zsum1 = 0
xsum2 = 0
ysum2 = 0
zsum2 = 0
c = 0


def translate(value, leftMin, leftMax, rightMin, rightMax):
    # Figure out how 'wide' each range is
    leftSpan = leftMax - leftMin
    rightSpan = rightMax - rightMin

    # Convert the left range into a 0-1 range (float)
    valueScaled = float(value - leftMin) / float(leftSpan)

    # Convert the 0-1 range into a value in the right range.
    return rightMin + (valueScaled * rightSpan)


def kur():
    global xsum, ysum, zsum, xsum1, ysum1, zsum1,xsum2, ysum2, zsum2, c

    for i in range(11):
        ser.readline()
        ser2.readline()
        print('..')

    t_end = time.time() + 10
    while time.time() < t_end:
        A = (ser.readline()).decode()
        B = A.split(" ")
        xsum += float(B[1])
        ysum += float(B[2])
        zsum += float(B[3])
        c += 1

        # A1 = (ser1.readline()).decode()
        # B1 = A2.split(" ")
        # xsum1 += float(B1[1])
        # ysum1 += float(B1[2])
        # zsum1 += float(B1[3])

        A2 = (ser2.readline()).decode()
        B2 = A2.split(" ")
        xsum2 += float(B2[1])
        ysum2 += float(B2[2])
        zsum2 += float(B2[3])

    xsum = xsum / c
    ysum = ysum / c
    zsum = zsum / c

    # xsum1 = xsum1 / c
    # ysum1 = ysum1 / c
    # zsum1 = zsum1 / c

    xsum2 = xsum2 / c
    ysum2 = ysum2 / c
    zsum2 = zsum2 / c



def neck_waist():
    A = (ser.readline()).decode()
    B = A.split(" ")
    B[1] = float(B[1]) - xsum + 90
    B[2] = float(B[2]) - ysum + 90
    B[3] = float(B[3]) - zsum + 90
    fx = float(B[1]) * 100 / 18

    if fx > 1000:
        fx = 1000
    if fx < 0:
        fx = 0
    # f.append(fx)

    fy = float(B[2]) * 100 / 18
    if fy > 1000:
        fy = 1000
    if fy < 0:
        fy = 0
    # f.append(fy)

    fz = float(B[3]) * 100 / 18
    if fz > 1000:
        fz = 1000
    if fz < 0:
        fz = 0
    # f.append(fz)
    return fy, fz


def lefthand():
    A = (ser.readline()).decode()
    B = A.split(" ")
    B[1] = float(B[1]) - xsum2
    B[2] = float(B[2]) - ysum2
    B[3] = float(B[3]) - zsum2
    rawx = float(B[2]) + 90
    rawz = float(B[3]) + 120

    if rawx > 160:
        rawx = 160
    if rawx < 0:
        rawx = 0

    if rawz > 240:
        rawz = 240
    if rawz < 0:
        rawz = 0

    fx = translate(rawx, 0, 160, 2.6, 0) - 1.2
    fz = translate(rawz, 0, 240, 0, 2.4) - 0.7

    return fx,fz


def rightforearm():
    A = (ser2.readline()).decode()
    B = A.split(" ")
    B[1] = float(B[1]) - xsum2
    B[2] = float(B[2]) - ysum2
    B[3] = float(B[3]) - zsum2
    frawx = float(B[3])
    frawy = float(B[1]) + 130

    if frawx > 135:
        frawx = 135
    if frawx < 0:
        frawx = 0

    if frawy > 210:
        frawy = 210
    if frawy < 0:
        frawy = 0

    fx = translate(frawx, 0, 140, 0, 2.4) - 0.7
    fy = translate(frawy, 0, 210, 3.6, 0) - 1.4

    return fx, fy

# this part is for the waist
# @app.route('/')
# def hello_world():
#     fy,fz = neck_waist()
#     # print()
#     response = jsonify({'Yaw': str(fz), 'Pitch': str(fy)})
#     response.headers.add('Access-Control-Allow-Origin', '*')
#     return response

# this part is for the left hand
@app.route('/')
def hello_world():
    fz1,fy1 = 0,0
    # fz1,fy1 = neck_waist()
    fz2,fy2 = lefthand()
    fz3,fy3 = rightforearm()
    # print()
    response = jsonify({'Yaw1': str(fz1), 'Pitch1': str(fy1),'Yaw2': str(fz2), 'Pitch2': str(fy2),'Yaw3': str(fz3), 'Pitch3': str(fy3)})
    # response = jsonify({'Yaw1': str(fz3), 'Pitch1': str(fy3)})
    # response = jsonify({'Yaw2': str(fz2), 'Pitch2': str(fy2),'Yaw3': str(fz3), 'Pitch3': str(fy3)})

    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

if __name__ == '__main__':
    kur()
    app.run()